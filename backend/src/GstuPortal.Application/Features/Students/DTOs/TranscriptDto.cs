namespace GstuPortal.Application.Features.Students.DTOs;

public record TranscriptDto(
    string StudentId,
    string StudentName,
    string Session,
    string Department,
    string Degree,
    double Cgpa,
    int TotalCredits,
    bool IsDistinction,
    int MeritRank,
    List<SemesterResultDto> Semesters,
    List<YearlyResultDto>? YearlyResults = null);
