using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Admin.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Admin.Queries;

public record GetAllThoughtsAdminQuery() : IRequest<List<AdminThoughtDto>>;

public class GetAllThoughtsAdminQueryHandler : IRequestHandler<GetAllThoughtsAdminQuery, List<AdminThoughtDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllThoughtsAdminQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminThoughtDto>> Handle(GetAllThoughtsAdminQuery request, CancellationToken cancellationToken)
    {
        var thoughts = await _context.BatchThoughts
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        return thoughts.Select(t => new AdminThoughtDto(
            t.Id,
            t.UserId,
            t.AuthorName,
            t.RoleTitle,
            t.Quote,
            t.AvatarUrl,
            t.IsApproved,
            t.CreatedAt
        )).ToList();
    }
}
