using GstuPortal.Domain.Common;

namespace GstuPortal.Domain.Entities;

public class CourseGrade : BaseEntity
{
    public Guid SemesterResultId { get; private set; }
    public SemesterResult SemesterResult { get; private set; } = null!;
    public string CourseCode { get; private set; } = string.Empty;
    public string CourseTitle { get; private set; } = string.Empty;
    public double Credits { get; private set; }
    public string GradeLetter { get; private set; } = string.Empty;
    public double GradePoint { get; private set; }

    private CourseGrade() { } // EF Core

    public CourseGrade(
        string courseCode,
        string courseTitle,
        double credits,
        string gradeLetter,
        double gradePoint)
    {
        CourseCode = courseCode.Trim();
        CourseTitle = courseTitle.Trim();
        Credits = credits;
        GradeLetter = gradeLetter.Trim().ToUpperInvariant();
        GradePoint = gradePoint;
    }
}
