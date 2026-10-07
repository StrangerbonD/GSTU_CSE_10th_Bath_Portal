using System.Net;
using System.Net.Http.Headers;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.Commands.VerifyEmail;
using GstuPortal.Domain.Entities;
using GstuPortal.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GstuPortal.IntegrationTests;

public class OtpAndRoleSecurityTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public OtpAndRoleSecurityTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Concurrent_Otp_Guesses_Are_Strictly_Gated_To_5_Attempts()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        var testEmail = $"otp_parallel_{Guid.NewGuid():N}@gstu.ac.bd";
        var user = new User(
            username: $"user_{Guid.NewGuid():N}"[..12],
            fullName: "Parallel OTP Tester",
            email: testEmail,
            passwordHash: "hash123",
            role: UserRole.Student);

        user.SetVerificationOtp("123456", DateTime.UtcNow.AddMinutes(15));
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // 20 concurrent wrong guesses sent simultaneously
        var tasks = Enumerable.Range(0, 20)
            .Select(async _ =>
            {
                using var reqScope = _factory.Services.CreateScope();
                var reqMediator = reqScope.ServiceProvider.GetRequiredService<IMediator>();
                return await reqMediator.Send(new VerifyEmailCommand(testEmail, "999999"));
            })
            .ToList();

        var results = await Task.WhenAll(tasks);

        // Every request must fail
        Assert.All(results, r => Assert.False(r.Success));

        // At most 4 requests could report remaining attempts before the code was locked
        var remainingResponses = results.Where(r => r.Message.Contains("attempt(s) remaining")).ToList();
        var lockedOrInvalidated = results.Where(r => 
            r.Message.Contains("Too many incorrect attempts") || 
            r.Message.Contains("No active verification code")).ToList();

        // Exactly 20 responses in total, strictly bounded by the 5-attempt ceiling
        Assert.Equal(20, remainingResponses.Count + lockedOrInvalidated.Count);
        Assert.True(remainingResponses.Count <= 4, $"Expected at most 4 remaining responses, but got {remainingResponses.Count}");
        Assert.True(lockedOrInvalidated.Count >= 16, $"Expected at least 16 locked/invalidated responses, but got {lockedOrInvalidated.Count}");

        // Confirm database state: OTP is wiped and attempts is at max (5)
        using var verifyScope = _factory.Services.CreateScope();
        var db = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var freshUser = await db.Users.FirstAsync(u => u.Id == user.Id);
        Assert.Null(freshUser.EmailVerificationOtp);
        Assert.Null(freshUser.EmailVerificationOtpExpiresAt);
        Assert.Equal(5, freshUser.EmailVerificationOtpAttempts);
    }

    [Fact]
    public async Task OnTokenValidated_Immediately_Revokes_Demoted_Admin()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var tokenGenerator = scope.ServiceProvider.GetRequiredService<IJwtTokenGenerator>();

        var testEmail = $"demoted_admin_{Guid.NewGuid():N}@gstu.ac.bd";
        var adminUser = new User(
            username: $"admin_{Guid.NewGuid():N}"[..12],
            fullName: "Demoted Admin Tester",
            email: testEmail,
            passwordHash: "hash123",
            role: UserRole.Admin);

        adminUser.MarkEmailAsVerified();
        context.Users.Add(adminUser);
        await context.SaveChangesAsync();

        // Generate an Admin token
        var adminToken = tokenGenerator.GenerateAccessToken(adminUser);

        // Verify initial access works
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var firstResp = await client.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.OK, firstResp.StatusCode);

        // DEMOTE the admin in the database to Student
        using var demoteScope = _factory.Services.CreateScope();
        var demoteContext = demoteScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var userInDb = await demoteContext.Users.FirstAsync(u => u.Id == adminUser.Id);
        userInDb.SetRole(UserRole.Student);
        await demoteContext.SaveChangesAsync();

        // Using the same 15-minute token, immediately request an admin endpoint
        var secondResp = await client.GetAsync("/api/admin/stats");

        // Real-time revocation via OnTokenValidated: Must be 401 Unauthorized
        Assert.Equal(HttpStatusCode.Unauthorized, secondResp.StatusCode);
    }
}
