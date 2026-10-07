using System.Security.Cryptography;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using GstuPortal.Domain.Entities;
using GstuPortal.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string Username,
    string FullName,
    string Email,
    string Password,
    string? StudentId = null,
    string? DeviceInfo = null,
    string? IpAddress = null) : IRequest<AuthResponseDto>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEmailService _emailService;

    public RegisterCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailService emailService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        GstuPortal.Application.Common.Validation.InputRules.ValidateUsername(request.Username);
        GstuPortal.Application.Common.Validation.InputRules.ValidateFullName(request.FullName);
        GstuPortal.Application.Common.Validation.InputRules.ValidateEmail(request.Email);
        GstuPortal.Application.Common.Validation.InputRules.ValidatePassword(request.Password);
        GstuPortal.Application.Common.Validation.InputRules.ValidateOptionalStudentId(request.StudentId);

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _context.Users.FirstOrDefaultAsync(
            u => u.Username.ToLower() == username.ToLower() || u.Email.ToLower() == email,
            cancellationToken);

        if (existingUser != null)
        {
            if (existingUser.IsEmailVerified)
            {
                throw new InvalidOperationException("A user with this username or email already exists. Please log in.");
            }

            // User registered previously but has not verified their email yet.
            // Safely refresh their password and issue a fresh 6-digit OTP so they are not locked out!
            var newPasswordHash = _passwordHasher.HashPassword(request.Password);
            existingUser.ChangePassword(newPasswordHash);

            var newOtp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            existingUser.SetVerificationOtp(newOtp, DateTime.UtcNow.AddMinutes(15));
            await _context.SaveChangesAsync(cancellationToken);

            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendOtpEmailAsync(existingUser.Email, existingUser.FullName, newOtp, CancellationToken.None);
                }
                catch
                {
                    // Handled inside EmailService
                }
            });

            return new AuthResponseDto(string.Empty, string.Empty, existingUser.ToDto(), null);
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var user = new User(
            username: username,
            fullName: request.FullName.Trim(),
            email: email,
            passwordHash: passwordHash,
            role: UserRole.User,
            studentId: request.StudentId);

        // Generate 6-digit verification OTP (valid for 15 minutes)
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        user.SetVerificationOtp(otp, DateTime.UtcNow.AddMinutes(15));

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // Send OTP email in the background so registration responds immediately
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendOtpEmailAsync(user.Email, user.FullName, otp, CancellationToken.None);
            }
            catch
            {
                // Handled inside EmailService
            }
        });

        var userDto = user.ToDto();

        // Production security: do NOT issue session tokens or leak OTP until email is verified
        return new AuthResponseDto(string.Empty, string.Empty, userDto, null);
    }
}
