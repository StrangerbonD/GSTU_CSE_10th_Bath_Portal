using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Thoughts.DTOs;
using GstuPortal.Domain.Entities;
using GstuPortal.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Thoughts.Queries.GetBatchThoughts;

public record GetBatchThoughtsQuery : IRequest<List<BatchThoughtDto>>;

public class GetBatchThoughtsQueryHandler : IRequestHandler<GetBatchThoughtsQuery, List<BatchThoughtDto>>
{
    private readonly IApplicationDbContext _context;

    public GetBatchThoughtsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BatchThoughtDto>> Handle(GetBatchThoughtsQuery request, CancellationToken cancellationToken)
    {
        var thoughts = await _context.BatchThoughts
            .Include(t => t.User)
            .AsNoTracking()
            .Where(t => t.IsApproved)
            .OrderByDescending(t => t.CreatedAt)
            .Take(30)
            .ToListAsync(cancellationToken);

        if (!thoughts.Any())
        {
            // Seed default approved community thoughts if empty
            var defaultThoughts = new List<BatchThought>
            {
                new BatchThought(
                    authorName: "Bondhon",
                    quote: "Proud to be a part of GSTU CSE 10th Batch! These four years shaped who we are today. The late-night coding sessions, lab experiments, and campus laughter will remain in our hearts forever. Wishing endless success to all my batchmates!",
                    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80",
                    userId: null,
                    roleTitle: "GSTU CSE 10th Batch",
                    isApproved: true
                ),
                new BatchThought(
                    authorName: "Tanvir Ahmed",
                    quote: "CSE 10th batch wasn't just a university class; we were a family that stood together through every semester, tough lab exam, and hackathon. Looking forward to our grand batch reunion soon!",
                    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=240&auto=format&fit=crop&q=80",
                    userId: null,
                    roleTitle: "GSTU CSE 10th Batch",
                    isApproved: true
                ),
                new BatchThought(
                    authorName: "Sabbir Hossain",
                    quote: "From our first 'Hello World' in C to our final year thesis defense, every single memory on this campus is truly priceless. Let's stay connected and keep supporting each other always.",
                    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
                    userId: null,
                    roleTitle: "GSTU CSE 10th Batch",
                    isApproved: true
                ),
                new BatchThought(
                    authorName: "Nafis Fuad",
                    quote: "The bonds we forged in GSTU CSE are unbreakable. So proud to see all of us growing into talented software engineers, researchers, and leaders across the industry. Keep shining, 10th batch!",
                    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80",
                    userId: null,
                    roleTitle: "GSTU CSE 10th Batch",
                    isApproved: true
                )
            };

            _context.BatchThoughts.AddRange(defaultThoughts);
            await _context.SaveChangesAsync(cancellationToken);

            thoughts = defaultThoughts;
        }

        return thoughts.Select(t =>
        {
            var isBatchVerified = t.User != null
                ? (t.User.IsVerifiedBatchStudent || t.User.ClaimStatus == ClaimStatus.Approved)
                : (!string.IsNullOrWhiteSpace(t.RoleTitle) && t.RoleTitle.Contains("10th Batch"));

            var authorName = !string.IsNullOrWhiteSpace(t.User?.FullName) ? t.User.FullName : t.AuthorName;
            var avatar = !string.IsNullOrWhiteSpace(t.User?.AvatarUrl) ? t.User.AvatarUrl : t.AvatarUrl;
            var role = isBatchVerified ? "GSTU CSE 10th Batch" : null;

            return new BatchThoughtDto(
                t.Id,
                authorName,
                role,
                t.Quote,
                avatar,
                GetRelativeTime(t.CreatedAt),
                isBatchVerified,
                t.CreatedAt
            );
        }).ToList();
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
