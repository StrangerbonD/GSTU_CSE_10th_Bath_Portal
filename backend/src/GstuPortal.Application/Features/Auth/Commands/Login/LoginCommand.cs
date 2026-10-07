using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using GstuPortal.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Auth.Commands.Login;

public record LoginCommand(
    string Username,
    string Password,
    string? DeviceInfo = null,
    string? IpAddress = null) : IRequest<AuthResponseDto>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var input = request.Username.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == input || u.Email.ToLower() == input, cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Your account has been deactivated. Please contact an administrator.");
        }

        if (!user.IsEmailVerified)
        {
            throw new InvalidOperationException("Please verify your email address before logging in. Enter the 6-digit verification code sent to your email.");
        }

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

        return new AuthResponseDto(accessToken, rawRefreshToken, userDto);
    }
}
