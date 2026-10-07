using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Admin.Commands.Users;

public record ToggleUserStatusCommand(Guid UserId) : IRequest<UserDto>;

public class ToggleUserStatusCommandHandler : IRequestHandler<ToggleUserStatusCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public ToggleUserStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.SetActiveStatus(!user.IsActive);

        if (!user.IsActive)
        {
            var activeSessions = await _context.UserSessions
                .Where(s => s.UserId == user.Id && !s.IsRevoked)
                .ToListAsync(cancellationToken);
            foreach (var session in activeSessions)
            {
                session.Revoke();
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
