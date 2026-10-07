using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Claims;

public record RejectCrClaimCommand(Guid UserId) : IRequest<UserDto>;

public class RejectCrClaimCommandHandler : IRequestHandler<RejectCrClaimCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public RejectCrClaimCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(RejectCrClaimCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.RejectCrClaim();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
