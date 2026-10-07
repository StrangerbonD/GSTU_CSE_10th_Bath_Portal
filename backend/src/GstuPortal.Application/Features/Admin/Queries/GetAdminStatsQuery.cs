using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Admin.DTOs;
using GstuPortal.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Admin.Queries;

public record GetAdminStatsQuery() : IRequest<AdminStatsDto>;

public class GetAdminStatsQueryHandler : IRequestHandler<GetAdminStatsQuery, AdminStatsDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminStatsDto> Handle(GetAdminStatsQuery request, CancellationToken cancellationToken)
    {
        var totalUsers = await _context.Users.CountAsync(cancellationToken);
        var verifiedStudents = await _context.Users.CountAsync(u => u.IsVerifiedBatchStudent, cancellationToken);
        var pendingBatchClaims = await _context.Users.CountAsync(u => u.ClaimStatus == ClaimStatus.Pending, cancellationToken);
        var totalCrs = await _context.Users.CountAsync(u => u.IsCr, cancellationToken);
        var pendingCrClaims = await _context.Users.CountAsync(u => u.CrClaimStatus == ClaimStatus.Pending, cancellationToken);
        var totalThoughts = await _context.BatchThoughts.CountAsync(cancellationToken);

        return new AdminStatsDto(
            totalUsers,
            verifiedStudents,
            pendingBatchClaims,
            totalCrs,
            pendingCrClaims,
            totalThoughts
        );
    }
}
