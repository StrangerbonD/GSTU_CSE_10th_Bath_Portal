using System.Data;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Students.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Students.Queries.VerifyStudent;

public record VerifyStudentQuery(string StudentId) : IRequest<StudentVerificationDto>;

public class VerifyStudentQueryHandler : IRequestHandler<VerifyStudentQuery, StudentVerificationDto>
{
    private readonly IApplicationDbContext _context;

    public VerifyStudentQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<StudentVerificationDto> Handle(VerifyStudentQuery request, CancellationToken cancellationToken)
    {
        var targetStudentId = request.StudentId.Trim().ToUpperInvariant();
        var conn = _context.GetConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        using var cmd = conn.CreateCommand();
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
            SELECT ""StudentId"", ""Name"", total_credits, cgpa, rank
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
            var studentId = reader.GetString(0);
            var studentName = reader.GetString(1);
            var totalCredits = Convert.ToInt32(Math.Round(reader.GetDecimal(2)));
            var cgpa = Convert.ToDouble(reader.GetDecimal(3));
            var isDistinction = cgpa >= 3.75;

            return new StudentVerificationDto(
                Verified: true,
                StudentId: studentId,
                StudentName: studentName,
                Session: "2020-2021",
                Department: "Department of Computer Science and Engineering",
                Degree: "B.Sc. Engineering in Computer Science and Engineering",
                Cgpa: cgpa,
                TotalCredits: totalCredits,
                IsDistinction: isDistinction,
                IssuedAt: DateTime.UtcNow);
        }

        throw new KeyNotFoundException($"Student with ID '{request.StudentId}' was not found.");
    }
}
