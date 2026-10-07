using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Claims;

public record RejectCrThoughtCommand(Guid UserId) : IRequest<UserDto>;

public class RejectCrThoughtCommandHandler : IRequestHandler<RejectCrThoughtCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public RejectCrThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(RejectCrThoughtCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.RejectCrThought();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
