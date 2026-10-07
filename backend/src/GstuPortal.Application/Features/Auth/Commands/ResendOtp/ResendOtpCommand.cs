using System.Security.Cryptography;
using GstuPortal.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Auth.Commands.ResendOtp;

public record ResendOtpCommand(string Email) : IRequest<ResendOtpResult>;

public class ResendOtpCommandHandler : IRequestHandler<ResendOtpCommand, ResendOtpResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public ResendOtpCommandHandler(
        IApplicationDbContext context,
        IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<ResendOtpResult> Handle(ResendOtpCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email || u.Username.ToLower() == email, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("No account found with this email address.");
        }

        if (user.IsEmailVerified)
        {
            return new ResendOtpResult(false, "This email is already verified. You can log in directly.");
        }

        // 5-minute cooldown check: User can only request a new code after 5 minutes have elapsed
        if (user.EmailVerificationOtpExpiresAt.HasValue && user.EmailVerificationOtpExpiresAt.Value > DateTime.UtcNow)
        {
            var remaining = user.EmailVerificationOtpExpiresAt.Value - DateTime.UtcNow;
            var minutes = (int)remaining.TotalMinutes;
            var seconds = remaining.Seconds;
            var timeFormatted = minutes > 0 ? $"{minutes}m {seconds}s" : $"{seconds}s";
            return new ResendOtpResult(false, $"A verification code was already sent. Please wait {timeFormatted} before requesting a new code.");
        }

        // Generate cryptographic 6-digit OTP (valid for 5 minutes)
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(5);

        user.SetVerificationOtp(otp, expiresAt);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendOtpEmailAsync(user.Email, user.FullName, otp, cancellationToken);

        return new ResendOtpResult(true, "A new 6-digit verification code has been sent to your email.");
    }
}
