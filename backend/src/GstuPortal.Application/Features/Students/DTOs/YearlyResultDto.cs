namespace GstuPortal.Application.Features.Students.DTOs;

public record YearlyResultDto(
    int YearNumber,
    string YearName,
    double TotalCreditsOffered,
    double TotalCreditsSecured,
    double Ygpa,
    int YearlyMeritRank);
