using GstuPortal.Domain.Common;

namespace GstuPortal.Domain.Entities;

public class SemesterResult : BaseEntity
{
    public Guid StudentId { get; private set; }
    public Student Student { get; private set; } = null!;
    public int YearNumber { get; private set; }
    public int SemesterNumber { get; private set; }
    public string SemesterName { get; private set; } = string.Empty;
    public double Gpa { get; private set; }
    public double CreditsOffered { get; private set; }
    public double CreditsSecured { get; private set; }
    public ICollection<CourseGrade> Courses { get; private set; } = new List<CourseGrade>();

    private SemesterResult() { } // EF Core

    public SemesterResult(
        int yearNumber,
        int semesterNumber,
        string semesterName,
        double gpa,
        double creditsOffered,
        double creditsSecured)
    {
        YearNumber = yearNumber;
        SemesterNumber = semesterNumber;
        SemesterName = semesterName;
        Gpa = gpa;
        CreditsOffered = creditsOffered;
        CreditsSecured = creditsSecured;
    }
}
