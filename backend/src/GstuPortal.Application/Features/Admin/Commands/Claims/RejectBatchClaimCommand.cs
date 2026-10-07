using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Claims;

public record RejectBatchClaimCommand(Guid UserId) : IRequest<UserDto>;

public class RejectBatchClaimCommandHandler : IRequestHandler<RejectBatchClaimCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public RejectBatchClaimCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(RejectBatchClaimCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.RejectClaim();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
