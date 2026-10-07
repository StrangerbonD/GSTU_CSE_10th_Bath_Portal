using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Claims.Commands.SubmitClaim;

public record SubmitClaimCommand(
    Guid UserId,
    string StudentId,
    string RecognitionNote) : IRequest<UserDto>;

public class SubmitClaimCommandHandler : IRequestHandler<SubmitClaimCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public SubmitClaimCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(SubmitClaimCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.SubmitClaim(request.StudentId, request.RecognitionNote);
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
