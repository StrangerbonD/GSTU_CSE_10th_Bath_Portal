using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using GstuPortal.Domain.Enums;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Users;

public record UpdateUserRoleCommand(Guid UserId, string Role) : IRequest<UserDto>;

public class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserRoleCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        if (!Enum.TryParse<UserRole>(request.Role, true, out var newRole))
        {
            throw new ArgumentException("Invalid role specified.");
        }

        user.SetRole(newRole);
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
