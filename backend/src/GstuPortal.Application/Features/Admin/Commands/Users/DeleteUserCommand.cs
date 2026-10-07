using GstuPortal.Application.Common.Interfaces;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Users;

public record DeleteUserCommand(Guid UserId) : IRequest<bool>;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteUserCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        if (user.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Super admin cannot be deleted.");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
