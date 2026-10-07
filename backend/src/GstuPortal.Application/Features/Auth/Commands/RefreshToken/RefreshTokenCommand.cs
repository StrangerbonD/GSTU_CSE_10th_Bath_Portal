using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using GstuPortal.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(
    string RawRefreshToken,
    string? DeviceInfo = null,
    string? IpAddress = null) : IRequest<AuthResponseDto>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var hashedToken = _jwtTokenGenerator.HashToken(request.RawRefreshToken);

        var session = await _context.UserSessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.RefreshTokenHash == hashedToken, cancellationToken);

        if (session == null)
        {
            throw new UnauthorizedAccessException("Session has expired or is invalid. Please log in again.");
        }

        if (session.IsRevoked)
        {
            // Grace window for concurrency:
            // If this token was rotated within the last 30 seconds, another concurrent tab or request rotated it.
            if (session.ReplacedAt.HasValue && DateTime.UtcNow - session.ReplacedAt.Value < TimeSpan.FromSeconds(30))
            {
                var userGrace = session.User;
                if (!userGrace.IsActive)
                    throw new UnauthorizedAccessException("Your account has been deactivated or banned.");

                var activeSession = await _context.UserSessions
                    .Where(s => s.UserId == userGrace.Id && !s.IsRevoked && s.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken);

                if (activeSession != null)
                {
                    var accessGraceToken = _jwtTokenGenerator.GenerateAccessToken(userGrace);
                    return new AuthResponseDto(accessGraceToken, string.Empty, userGrace.ToDto());
                }
            }

            // REUSE DETECTION: A revoked token was presented outside the grace window.
            // Revoke all sessions for this user to protect against session hijacking.
            var allSessions = await _context.UserSessions
                .Where(s => s.UserId == session.UserId && !s.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var s in allSessions)
            {
                s.Revoke();
            }
            await _context.SaveChangesAsync(cancellationToken);

            throw new UnauthorizedAccessException("Security alert: Stale or revoked session token presented. All active sessions have been terminated.");
        }

        if (session.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Session has expired. Please log in again.");
        }

        // Token rotation: mark old session as rotated
        session.Rotate();

        var user = session.User;
        if (!user.IsActive)
        {
            await _context.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Your account has been deactivated or banned. Please contact an administrator.");
        }

        if (!user.IsEmailVerified)
        {
            await _context.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Please verify your email address before accessing your account.");
        }

        var newAccessToken = _jwtTokenGenerator.GenerateAccessToken(user);
        var newRawRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        var newHashedRefreshToken = _jwtTokenGenerator.HashToken(newRawRefreshToken);

        var newSession = new UserSession(
            userId: user.Id,
            refreshTokenHash: newHashedRefreshToken,
            expiresAt: DateTime.UtcNow.AddDays(30),
            deviceInfo: request.DeviceInfo ?? session.DeviceInfo,
            ipAddress: request.IpAddress ?? session.IpAddress);

        _context.UserSessions.Add(newSession);
        await _context.SaveChangesAsync(cancellationToken);

        var userDto = user.ToDto();

        return new AuthResponseDto(newAccessToken, newRawRefreshToken, userDto);
    }
}
