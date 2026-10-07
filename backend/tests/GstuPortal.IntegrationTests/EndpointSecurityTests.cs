using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GstuPortal.IntegrationTests;

public class EndpointSecurityTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public EndpointSecurityTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Only_expected_endpoints_are_anonymous()
    {
        using var scope = _factory.Services.CreateScope();
        var ds = scope.ServiceProvider.GetRequiredService<EndpointDataSource>();

        var anon = ds.Endpoints.OfType<RouteEndpoint>()
            .Where(e => e.Metadata.GetMetadata<IAllowAnonymous>() != null)
            .Select(e =>
            {
                var method = e.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods.FirstOrDefault() ?? "ANY";
                var pattern = e.RoutePattern.RawText?.TrimStart('/').ToLowerInvariant();
                return $"{method} {pattern}";
            })
            .OrderBy(x => x)
            .Distinct()
            .ToList();

        // The exact, intentional whitelist of unauthenticated endpoints
        var expected = new[]
        {
            "GET api/health",
            "GET api/landing-photos",
            "GET api/representatives",
            "GET api/statistics",
            "GET api/students/verify/{studentid}",
            "GET api/thoughts",
            "GET api/users/{id:guid}/avatar",
            "POST api/auth/login",
            "POST api/auth/logout",
            "POST api/auth/refresh",
            "POST api/auth/register",
            "POST api/auth/resend-otp",
            "POST api/auth/verify-email",
            "POST api/login",
            "POST api/logout",
            "POST api/refresh-token",
            "POST api/register",
            "POST api/resend-otp",
            "POST api/verify-email"
        }.OrderBy(x => x).Distinct().ToList();

        Assert.Equal(expected, anon);
    }

    [Fact]
    public void All_admin_endpoints_require_admin_role()
    {
        using var scope = _factory.Services.CreateScope();
        var ds = scope.ServiceProvider.GetRequiredService<EndpointDataSource>();

        var adminEndpoints = ds.Endpoints.OfType<RouteEndpoint>()
            .Where(e => (e.RoutePattern.RawText ?? "").StartsWith("api/admin", StringComparison.OrdinalIgnoreCase))
            .ToList();

        Assert.NotEmpty(adminEndpoints);

        foreach (var endpoint in adminEndpoints)
        {
            var authData = endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>();
            var roles = authData.Select(a => a.Roles).Where(r => !string.IsNullOrEmpty(r)).ToList();

            Assert.True(
                roles.Any(r => r!.Contains("Admin")),
                $"Admin endpoint '{endpoint.RoutePattern.RawText}' must strictly require Admin role!");
        }
    }

    [Fact]
    public async Task GetTranscriptQuery_Returns_Valid_Transcript_With_Ordinals_And_Yearly_Ranks()
    {
        using var scope = _factory.Services.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<MediatR.IMediator>();
        var transcript = await mediator.Send(new GstuPortal.Application.Features.Students.Queries.GetTranscript.GetTranscriptQuery("20CSE016"));
        Assert.NotNull(transcript);
        Assert.Equal("20CSE016", transcript.StudentId);
        Assert.NotEmpty(transcript.Semesters);
        Assert.Equal("1st Year 1st Semester", transcript.Semesters[0].SemesterName);
        Assert.NotNull(transcript.YearlyResults);
        Assert.Equal(4, transcript.YearlyResults.Count);
        Assert.True(transcript.YearlyResults[0].YearlyMeritRank > 0);
    }
}

