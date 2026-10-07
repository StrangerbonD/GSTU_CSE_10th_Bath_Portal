using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using GstuPortal.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Auth.Commands.VerifyEmail;

public record VerifyEmailCommand(
    string Email,
    string Code,
    string? DeviceInfo = null,
    string? IpAddress = null) : IRequest<VerifyEmailResult>;

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, VerifyEmailResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public VerifyEmailCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<VerifyEmailResult> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var code = request.Code.Trim();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email || u.Username.ToLower() == email, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("No account found with this email address.");
        }

        if (string.IsNullOrWhiteSpace(user.EmailVerificationOtp) || !user.EmailVerificationOtpExpiresAt.HasValue)
        {
            return new VerifyEmailResult(false, "No active verification code found. Please request a new code.");
        }

        if (DateTime.UtcNow > user.EmailVerificationOtpExpiresAt.Value)
        {
            return new VerifyEmailResult(false, "Verification code has expired. Please request a new code.");
        }

        // 1. ATOMIC ATTEMPT RESERVATION GATE:
        // Pre-decrement/reserve an attempt in DB before evaluating the OTP hash.
        // Only rows where EmailVerificationOtpAttempts < 5 and active OTP exists will increment.
        var reserved = await _context.Users
            .Where(u => u.Id == user.Id 
                        && u.EmailVerificationOtpAttempts < 5 
                        && u.EmailVerificationOtp != null 
                        && u.EmailVerificationOtpExpiresAt > DateTime.UtcNow)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.EmailVerificationOtpAttempts, x => x.EmailVerificationOtpAttempts + 1)
                .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

        if (reserved == 0)
        {
            return new VerifyEmailResult(false, "Too many incorrect attempts. This verification code has been permanently locked. Please request a new code.");
        }

        // 2. VERIFY OTP MATCH (FixedTimeEquals)
        var incomingHash = User.HashOtp(code);
        bool isMatch = System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(user.EmailVerificationOtp.Trim()),
            System.Text.Encoding.UTF8.GetBytes(incomingHash.Trim())
        );

        if (!isMatch)
        {
            var latest = await _context.Users
                .Where(u => u.Id == user.Id)
                .Select(u => new { u.EmailVerificationOtpAttempts })
                .FirstOrDefaultAsync(cancellationToken);

            var currentAttempts = latest?.EmailVerificationOtpAttempts ?? 5;

            if (currentAttempts >= 5)
            {
                // Invalidate permanently: wipe OTP and keep attempts at 5
                await _context.Users
                    .Where(u => u.Id == user.Id)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(x => x.EmailVerificationOtp, (string?)null)
                        .SetProperty(x => x.EmailVerificationOtpExpiresAt, (DateTime?)null)
                        .SetProperty(x => x.EmailVerificationOtpAttempts, 5)
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

                return new VerifyEmailResult(false, "Too many incorrect attempts. This verification code has been permanently locked. Please request a new code.");
            }

            int remaining = Math.Max(0, 5 - currentAttempts);
            return new VerifyEmailResult(false, $"Invalid verification code. You have {remaining} attempt(s) remaining.");
        }

        // 3. OTP MATCHED! Mark verified and clear OTP fields atomically
        await _context.Users
            .Where(u => u.Id == user.Id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.IsEmailVerified, true)
                .SetProperty(x => x.EmailVerificationOtp, (string?)null)
                .SetProperty(x => x.EmailVerificationOtpExpiresAt, (DateTime?)null)
                .SetProperty(x => x.EmailVerificationOtpAttempts, 0)
                .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

        user.MarkEmailAsVerified();

        // Generate session & tokens for verified user
        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user);
        var rawRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        var hashedRefreshToken = _jwtTokenGenerator.HashToken(rawRefreshToken);

        var session = new UserSession(
            userId: user.Id,
            refreshTokenHash: hashedRefreshToken,
            expiresAt: DateTime.UtcNow.AddDays(30),
            deviceInfo: request.DeviceInfo,
            ipAddress: request.IpAddress);

        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);

        var userDto = user.ToDto();
        return new VerifyEmailResult(true, "Email verified successfully! Welcome to the portal.", accessToken, rawRefreshToken, userDto);
    }
}
