using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Claims.Commands.ApproveCrClaim;

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
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.ApproveCrClaim();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
