using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Claims;

public record ApproveBatchClaimCommand(Guid UserId) : IRequest<UserDto>;

public class ApproveBatchClaimCommandHandler : IRequestHandler<ApproveBatchClaimCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public ApproveBatchClaimCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(ApproveBatchClaimCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.ApproveClaim();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
