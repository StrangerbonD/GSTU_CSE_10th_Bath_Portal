using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Claims.Commands.ApproveClaim;

public record ApproveClaimCommand(Guid UserId) : IRequest<UserDto>;

public class ApproveClaimCommandHandler : IRequestHandler<ApproveClaimCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public ApproveClaimCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(ApproveClaimCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (!string.IsNullOrWhiteSpace(user.StudentId))
        {
            var alreadyVerified = await _context.Users.AnyAsync(
                u => u.Id != user.Id && u.StudentId == user.StudentId && u.IsVerifiedBatchStudent,
                cancellationToken);

            if (alreadyVerified)
            {
                throw new InvalidOperationException($"Student ID {user.StudentId} has already been verified and claimed by another student account.");
            }
        }

        user.ApproveClaim();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
