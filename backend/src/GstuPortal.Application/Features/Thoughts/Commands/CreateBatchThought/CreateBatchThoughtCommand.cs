using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Thoughts.DTOs;
using GstuPortal.Domain.Entities;
using GstuPortal.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Thoughts.Commands.CreateBatchThought;

public record CreateBatchThoughtCommand(Guid UserId, string Quote) : IRequest<BatchThoughtDto>;

public class CreateBatchThoughtCommandHandler : IRequestHandler<CreateBatchThoughtCommand, BatchThoughtDto>
{
    private readonly IApplicationDbContext _context;

    public CreateBatchThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BatchThoughtDto> Handle(CreateBatchThoughtCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var isBatchVerified = user.IsVerifiedBatchStudent || user.ClaimStatus == ClaimStatus.Approved;
        var roleTitle = isBatchVerified ? "GSTU CSE 10th Batch" : string.Empty;

        var existingThought = await _context.BatchThoughts
            .FirstOrDefaultAsync(t => t.UserId == user.Id, cancellationToken);

        BatchThought thought;
        if (existingThought != null)
        {
            existingThought.UpdateContent(request.Quote, user.AvatarUrl, roleTitle);
            thought = existingThought;
        }
        else
        {
            thought = new BatchThought(
                authorName: user.FullName,
                quote: request.Quote.Trim(),
                avatarUrl: user.AvatarUrl,
                userId: user.Id,
                roleTitle: roleTitle,
                isApproved: false);

            _context.BatchThoughts.Add(thought);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new BatchThoughtDto(
            thought.Id,
            thought.AuthorName,
            isBatchVerified ? "GSTU CSE 10th Batch" : null,
            thought.Quote,
            thought.AvatarUrl ?? user.AvatarUrl,
            "Just now",
            isBatchVerified,
            thought.CreatedAt,
            thought.IsApproved);
    }
}
