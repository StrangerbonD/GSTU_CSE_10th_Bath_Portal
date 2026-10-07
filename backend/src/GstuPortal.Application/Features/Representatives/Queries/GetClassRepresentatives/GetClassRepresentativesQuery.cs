using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Representatives.DTOs;
using GstuPortal.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Representatives.Queries.GetClassRepresentatives;

public record GetClassRepresentativesQuery : IRequest<List<ClassRepresentativeDto>>;

public class GetClassRepresentativesQueryHandler : IRequestHandler<GetClassRepresentativesQuery, List<ClassRepresentativeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetClassRepresentativesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClassRepresentativeDto>> Handle(GetClassRepresentativesQuery request, CancellationToken cancellationToken)
    {
        var crUsers = await _context.Users
            .AsNoTracking()
            .Where(u => u.IsCr && u.CrClaimStatus == ClaimStatus.Approved && !string.IsNullOrWhiteSpace(u.CrThought) && !string.IsNullOrWhiteSpace(u.CrTenure))
            .OrderBy(u => u.CreatedAt)
            .ToListAsync(cancellationToken);

        return crUsers.Select(u => new ClassRepresentativeDto(
            u.Id,
            u.FullName,
            u.CrTenure!,
            "Class Representative",
            !string.IsNullOrWhiteSpace(u.AvatarUrl) ? u.AvatarUrl : null,
            u.CrThought
        )).ToList();
    }
}
