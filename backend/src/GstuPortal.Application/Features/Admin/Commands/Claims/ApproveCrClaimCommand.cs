using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Claims;

public record ApproveCrClaimCommand(Guid UserId) : IRequest<UserDto>;

public class ApproveCrClaimCommandHandler : IRequestHandler<ApproveCrClaimCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public ApproveCrClaimCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(ApproveCrClaimCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.ApproveCrClaim();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
