namespace GstuPortal.Application.Features.Admin.DTOs;

public record AdminStatsDto(
    int TotalUsers,
    int VerifiedStudents,
    int PendingBatchClaims,
    int TotalCrs,
    int PendingCrClaims,
    int TotalThoughts
);
