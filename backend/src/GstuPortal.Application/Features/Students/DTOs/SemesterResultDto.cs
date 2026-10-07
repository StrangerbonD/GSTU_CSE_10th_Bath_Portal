namespace GstuPortal.Application.Features.Students.DTOs;

public record SemesterResultDto(
    int YearNumber,
    int SemesterNumber,
    string SemesterName,
    double Gpa,
    double CreditsOffered,
    double CreditsSecured,
    List<CourseGradeDto> Courses);
