namespace GstuPortal.Application.Features.Admin.DTOs;

public record AdminStudentDto(
    int Id,
    string StudentId,
    string Name,
    int TotalCredits,
    double Cgpa,
    int MeritRank
);
