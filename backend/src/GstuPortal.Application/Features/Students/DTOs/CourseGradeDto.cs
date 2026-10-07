namespace GstuPortal.Application.Features.Students.DTOs;

public record CourseGradeDto(
    string CourseCode,
    string CourseTitle,
    double Credits,
    string GradeLetter,
    double GradePoint);
