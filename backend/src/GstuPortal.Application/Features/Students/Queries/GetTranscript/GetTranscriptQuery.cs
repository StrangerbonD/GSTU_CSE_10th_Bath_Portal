using System.Data;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Students.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Students.Queries.GetTranscript;

public record GetTranscriptQuery(string StudentId) : IRequest<TranscriptDto>;

public class GetTranscriptQueryHandler : IRequestHandler<GetTranscriptQuery, TranscriptDto>
{
    private readonly IApplicationDbContext _context;

    public GetTranscriptQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TranscriptDto> Handle(GetTranscriptQuery request, CancellationToken cancellationToken)
    {
        var targetStudentId = request.StudentId.Trim().ToUpperInvariant();
        var conn = _context.GetConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        // 1. Fetch Student and Rank/CGPA calculation
        int studentDbId = 0;
        string studentId = targetStudentId;
        string studentName = "";
        double cgpa = 0.0;
        int totalCredits = 0;
        int meritRank = 0;

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                WITH student_cgpa AS (
                    SELECT s.""Id"", s.""StudentId"", s.""Name"",
                           COALESCE(SUM(sr.""CreditSecured""), 0) AS total_credits,
                           CASE WHEN COALESCE(SUM(sr.""CreditSecured""), 0) > 0 
                                THEN ROUND(SUM(sr.""PointScored"") / SUM(sr.""CreditSecured""), 3)
                                ELSE 0.0 END AS cgpa,
                           RANK() OVER (ORDER BY (CASE WHEN COALESCE(SUM(sr.""CreditSecured""), 0) > 0 
                                THEN (SUM(sr.""PointScored"") / SUM(sr.""CreditSecured""))
                                ELSE 0 END) DESC) AS rank
                    FROM students s
                    LEFT JOIN semesterresults sr ON s.""Id"" = sr.""StudentId""
                    GROUP BY s.""Id"", s.""StudentId"", s.""Name""
                )
                SELECT ""Id"", ""StudentId"", ""Name"", total_credits, cgpa, rank
                FROM student_cgpa
                WHERE UPPER(""StudentId"") = UPPER(@stdId);
            ";
            var p = cmd.CreateParameter();
            p.ParameterName = "@stdId";
            p.Value = targetStudentId;
            cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                studentDbId = reader.GetInt32(0);
                studentId = reader.GetString(1);
                studentName = reader.GetString(2);
                totalCredits = Convert.ToInt32(Math.Round(reader.GetDecimal(3)));
                cgpa = Convert.ToDouble(reader.GetDecimal(4));
                meritRank = Convert.ToInt32(reader.GetInt64(5));
            }
            else
            {
                throw new KeyNotFoundException($"Student with ID '{request.StudentId}' was not found.");
            }
        }

        // 2. Fetch Semester Results
        var semesterMap = new Dictionary<int, (int semId, string semName, double gpa, double creditsOffered, double creditsSecured)>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT sr.""SemesterId"", sem.""Name"", sr.""GPA"", sr.""CreditOffered"", sr.""CreditSecured""
                FROM semesterresults sr
                JOIN semesters sem ON sr.""SemesterId"" = sem.""Id""
                WHERE sr.""StudentId"" = @studentDbId
                ORDER BY sem.""Id"";
            ";
            var p = cmd.CreateParameter();
            p.ParameterName = "@studentDbId";
            p.Value = studentDbId;
            cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                int semId = reader.GetInt32(0);
                string semName = reader.GetString(1);
                double gpa = Convert.ToDouble(reader.GetDecimal(2));
                double creditsOffered = Convert.ToDouble(reader.GetDecimal(3));
                double creditsSecured = Convert.ToDouble(reader.GetDecimal(4));
                semesterMap[semId] = (semId, semName, gpa, creditsOffered, creditsSecured);
            }
        }

        // 3. Fetch Course Results
        var coursesBySemester = new Dictionary<int, List<CourseGradeDto>>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT scr.""SemesterId"", c.""CourseCode"", c.""CourseTitle"", c.""Credit"", scr.""Grade"", scr.""GradePoint""
                FROM studentcourseresults scr
                JOIN courses c ON scr.""CourseId"" = c.""Id""
                WHERE scr.""StudentId"" = @studentDbId
                ORDER BY scr.""SemesterId"", c.""CourseCode"";
            ";
            var p = cmd.CreateParameter();
            p.ParameterName = "@studentDbId";
            p.Value = studentDbId;
            cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                int semId = reader.GetInt32(0);
                string code = reader.GetString(1);
                string title = reader.GetString(2);
                double credits = Convert.ToDouble(reader.GetDecimal(3));
                string grade = reader.GetString(4);
                double point = Convert.ToDouble(reader.GetDecimal(5));

                if (!coursesBySemester.ContainsKey(semId))
                {
                    coursesBySemester[semId] = new List<CourseGradeDto>();
                }
                coursesBySemester[semId].Add(new CourseGradeDto(code, title, credits, grade, point));
            }
        }

        // 2b. Fetch Yearly Merit Ranks across all batch students
        var yearlyRanks = new Dictionary<int, int>();
        try
        {
            using var rankCmd = conn.CreateCommand();
            rankCmd.CommandText = @"
                WITH yearly_stats AS (
                    SELECT sr.""StudentId"",
                           CAST(SUBSTRING(sem.""Name"" FROM 1 FOR 1) AS INTEGER) AS year_num,
                           SUM(sr.""CreditSecured"") AS credits,
                           CASE WHEN SUM(sr.""CreditSecured"") > 0 
                                THEN (SUM(sr.""PointScored"") / SUM(sr.""CreditSecured"")) 
                                ELSE 0 END AS ygpa,
                           RANK() OVER (
                               PARTITION BY SUBSTRING(sem.""Name"" FROM 1 FOR 1) 
                               ORDER BY (CASE WHEN SUM(sr.""CreditSecured"") > 0 
                                              THEN (SUM(sr.""PointScored"") / SUM(sr.""CreditSecured"")) 
                                              ELSE 0 END) DESC
                           ) AS year_rank
                    FROM semesterresults sr
                    JOIN semesters sem ON sr.""SemesterId"" = sem.""Id""
                    GROUP BY sr.""StudentId"", SUBSTRING(sem.""Name"" FROM 1 FOR 1)
                )
                SELECT year_num, year_rank
                FROM yearly_stats
                WHERE ""StudentId"" = @studentDbId;
            ";
            var rp = rankCmd.CreateParameter();
            rp.ParameterName = "@studentDbId";
            rp.Value = studentDbId;
            rankCmd.Parameters.Add(rp);

            using var rankReader = await rankCmd.ExecuteReaderAsync(cancellationToken);
            while (await rankReader.ReadAsync(cancellationToken))
            {
                int yNum = rankReader.GetInt32(0);
                int yRank = Convert.ToInt32(rankReader.GetInt64(1));
                yearlyRanks[yNum] = yRank;
            }
        }
        catch
        {
            // Fallback gracefully if database schema has variation
        }

        static string GetOrdinal(int n) => n switch
        {
            1 => "1st",
            2 => "2nd",
            3 => "3rd",
            4 => "4th",
            _ => $"{n}th"
        };

        // Build SemesterResultDtos
        var semesterDtos = new List<SemesterResultDto>();
        foreach (var kvp in semesterMap.OrderBy(x => x.Key))
        {
            var semInfo = kvp.Value;
            var parts = semInfo.semName.Split('-');
            int yearNum = parts.Length > 0 && int.TryParse(parts[0], out var y) ? y : 1;
            int semNum = parts.Length > 1 && int.TryParse(parts[1], out var s) ? s : 1;
            string formattedSemName = $"{GetOrdinal(yearNum)} Year {GetOrdinal(semNum)} Semester";

            var courses = coursesBySemester.TryGetValue(semInfo.semId, out var cList) ? cList : new List<CourseGradeDto>();

            semesterDtos.Add(new SemesterResultDto(
                yearNum,
                semNum,
                formattedSemName,
                semInfo.gpa,
                semInfo.creditsOffered,
                semInfo.creditsSecured,
                courses
            ));
        }

        // Build YearlyResultDtos
        var yearlyDtos = new List<YearlyResultDto>();
        for (int y = 1; y <= 4; y++)
        {
            var yearSems = semesterDtos.Where(s => s.YearNumber == y).ToList();
            double yOffered = yearSems.Sum(s => s.CreditsOffered);
            double ySecured = yearSems.Sum(s => s.CreditsSecured);
            double yPoints = yearSems.Sum(s => s.CreditsOffered * s.Gpa);
            double ygpa = yOffered > 0 ? Math.Round(yPoints / yOffered, 3) : 0.0;
            int yRank = yearlyRanks.TryGetValue(y, out var r) ? r : meritRank;

            yearlyDtos.Add(new YearlyResultDto(
                y,
                $"{GetOrdinal(y)} Year",
                yOffered,
                ySecured,
                ygpa,
                yRank > 0 ? yRank : meritRank
            ));
        }

        bool isDistinction = cgpa >= 3.75;

        return new TranscriptDto(
            studentId,
            studentName,
            "2020-2021",
            "Department of Computer Science and Engineering",
            "B.Sc. Engineering in Computer Science and Engineering",
            cgpa,
            totalCredits,
            isDistinction,
            meritRank,
            semesterDtos,
            yearlyDtos);
    }
}

