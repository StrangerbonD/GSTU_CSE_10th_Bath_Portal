using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Claims.Commands.SubmitCrClaim;

public record SubmitCrClaimCommand(Guid UserId, string Note) : IRequest<UserDto>;

public class SubmitCrClaimCommandHandler : IRequestHandler<SubmitCrClaimCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public SubmitCrClaimCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(SubmitCrClaimCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.SubmitCrClaim(request.Note);
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
