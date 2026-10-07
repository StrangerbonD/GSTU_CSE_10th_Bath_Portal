namespace GstuPortal.Application.Features.Admin.DTOs;

public record EditCourseGradeDto(
    int SemesterId,
    string CourseCode,
    string Grade,
    double GradePoint
);
