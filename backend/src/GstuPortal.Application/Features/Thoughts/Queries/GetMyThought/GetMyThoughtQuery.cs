using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Thoughts.DTOs;
using GstuPortal.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Thoughts.Queries.GetMyThought;

public record GetMyThoughtQuery(Guid UserId) : IRequest<BatchThoughtDto?>;

public class GetMyThoughtQueryHandler : IRequestHandler<GetMyThoughtQuery, BatchThoughtDto?>
{
    private readonly IApplicationDbContext _context;

    public GetMyThoughtQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BatchThoughtDto?> Handle(GetMyThoughtQuery request, CancellationToken cancellationToken)
    {
        var thought = await _context.BatchThoughts
            .Include(t => t.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (thought == null) return null;

        var user = thought.User;
        var isBatchVerified = user != null
            ? (user.IsVerifiedBatchStudent || user.ClaimStatus == ClaimStatus.Approved)
            : (!string.IsNullOrWhiteSpace(thought.RoleTitle) && thought.RoleTitle.Contains("10th Batch"));

        var authorName = !string.IsNullOrWhiteSpace(user?.FullName) ? user.FullName : thought.AuthorName;
        var avatar = !string.IsNullOrWhiteSpace(user?.AvatarUrl) ? user.AvatarUrl : thought.AvatarUrl;
        var role = isBatchVerified ? "GSTU CSE 10th Batch" : null;

        return new BatchThoughtDto(
            thought.Id,
            authorName,
            role,
            thought.Quote,
            avatar,
            GetRelativeTime(thought.CreatedAt),
            isBatchVerified,
            thought.CreatedAt,
            thought.IsApproved
        );
    }

    private static string GetRelativeTime(DateTime dt)
    {
        var span = DateTime.UtcNow - dt;
        if (span.TotalMinutes < 1) return "Just now";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} minutes ago";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} hours ago";
        if (span.TotalDays < 7) return $"{(int)span.TotalDays} days ago";
        return dt.ToString("dd MMM yyyy, hh:mm tt");
    }
}
