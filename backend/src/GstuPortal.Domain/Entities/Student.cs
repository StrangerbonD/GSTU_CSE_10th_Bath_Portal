using GstuPortal.Domain.Common;

namespace GstuPortal.Domain.Entities;

public class Student : BaseEntity
{
    public string StudentId { get; private set; } = string.Empty;
    public string StudentName { get; private set; } = string.Empty;
    public double Cgpa { get; private set; }
    public int TotalCredits { get; private set; }
    public bool IsDistinction { get; private set; }
    public int MeritRank { get; private set; }
    public ICollection<SemesterResult> Semesters { get; private set; } = new List<SemesterResult>();

    private Student() { } // EF Core

    public Student(
        string studentId,
        string studentName,
        double cgpa,
        int totalCredits,
        bool isDistinction,
        int meritRank)
    {
        StudentId = studentId.Trim().ToUpperInvariant();
        StudentName = studentName.Trim();
        Cgpa = cgpa;
        TotalCredits = totalCredits;
        IsDistinction = isDistinction;
        MeritRank = meritRank;
    }

    public void UpdateRankAndCgpa(double cgpa, int meritRank, bool isDistinction)
    {
        Cgpa = cgpa;
        MeritRank = meritRank;
        IsDistinction = isDistinction;
        SetUpdated();
    }
}
