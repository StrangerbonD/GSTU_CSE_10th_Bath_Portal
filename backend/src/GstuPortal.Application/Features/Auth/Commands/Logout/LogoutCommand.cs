using GstuPortal.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Auth.Commands.Logout;

public record LogoutCommand(string RawRefreshToken) : IRequest<bool>;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LogoutCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RawRefreshToken)) return true;

        var hashed = _jwtTokenGenerator.HashToken(request.RawRefreshToken);
        var session = await _context.UserSessions
            .FirstOrDefaultAsync(s => s.RefreshTokenHash == hashed, cancellationToken);

        if (session != null)
        {
            session.Revoke();
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
