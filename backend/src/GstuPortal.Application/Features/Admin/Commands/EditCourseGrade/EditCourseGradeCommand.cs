using System.Data;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Admin.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.EditCourseGrade;

public record EditCourseGradeCommand(string StudentId, EditCourseGradeDto Dto) : IRequest<bool>;

public class EditCourseGradeCommandHandler : IRequestHandler<EditCourseGradeCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public EditCourseGradeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(EditCourseGradeCommand request, CancellationToken cancellationToken)
    {
        var targetStdId = request.StudentId.Trim().ToUpperInvariant();
        var targetCourseCode = request.Dto.CourseCode.Trim().ToUpperInvariant();

        var conn = _context.GetConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        // 1. Get student database ID
        int stdDbId = 0;
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"SELECT ""Id"" FROM students WHERE UPPER(""StudentId"") = UPPER(@sId) LIMIT 1;";
            var p = cmd.CreateParameter();
            p.ParameterName = "@sId";
            p.Value = targetStdId;
            cmd.Parameters.Add(p);
            var obj = await cmd.ExecuteScalarAsync(cancellationToken);
            if (obj == null) throw new KeyNotFoundException($"Student '{request.StudentId}' not found.");
            stdDbId = Convert.ToInt32(obj);
        }

        // 2. Get course database ID
        int courseDbId = 0;
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"SELECT ""Id"" FROM courses WHERE UPPER(""CourseCode"") = UPPER(@cCode) LIMIT 1;";
            var p = cmd.CreateParameter();
            p.ParameterName = "@cCode";
            p.Value = targetCourseCode;
            cmd.Parameters.Add(p);
            var obj = await cmd.ExecuteScalarAsync(cancellationToken);
            if (obj == null) throw new KeyNotFoundException($"Course '{request.Dto.CourseCode}' not found.");
            courseDbId = Convert.ToInt32(obj);
        }

        // 3. Update studentcourseresults
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                UPDATE studentcourseresults
                SET ""Grade"" = @grade, ""GradePoint"" = @gp
                WHERE ""StudentId"" = @stdId AND ""SemesterId"" = @semId AND ""CourseId"" = @cId;
            ";
            var p1 = cmd.CreateParameter(); p1.ParameterName = "@grade"; p1.Value = request.Dto.Grade.Trim(); cmd.Parameters.Add(p1);
            var p2 = cmd.CreateParameter(); p2.ParameterName = "@gp"; p2.Value = (decimal)request.Dto.GradePoint; cmd.Parameters.Add(p2);
            var p3 = cmd.CreateParameter(); p3.ParameterName = "@stdId"; p3.Value = stdDbId; cmd.Parameters.Add(p3);
            var p4 = cmd.CreateParameter(); p4.ParameterName = "@semId"; p4.Value = request.Dto.SemesterId; cmd.Parameters.Add(p4);
            var p5 = cmd.CreateParameter(); p5.ParameterName = "@cId"; p5.Value = courseDbId; cmd.Parameters.Add(p5);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }

        // 4. Recalculate semesterresults for this student & semester
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                WITH sem_calc AS (
                    SELECT 
                        scr.""StudentId"",
                        scr.""SemesterId"",
                        SUM(c.""Credit"") AS credit_offered,
                        SUM(CASE WHEN scr.""GradePoint"" > 0 THEN c.""Credit"" ELSE 0 END) AS credit_secured,
                        SUM(c.""Credit"" * scr.""GradePoint"") AS point_scored,
                        ROUND(SUM(c.""Credit"" * scr.""GradePoint"") / NULLIF(SUM(CASE WHEN scr.""GradePoint"" > 0 THEN c.""Credit"" ELSE 0 END), 0), 3) AS gpa
                    FROM studentcourseresults scr
                    JOIN courses c ON scr.""CourseId"" = c.""Id""
                    WHERE scr.""StudentId"" = @stdId AND scr.""SemesterId"" = @semId
                    GROUP BY scr.""StudentId"", scr.""SemesterId""
                )
                UPDATE semesterresults sr
                SET ""CreditOffered"" = sc.credit_offered,
                    ""CreditSecured"" = sc.credit_secured,
                    ""PointScored"" = sc.point_scored,
                    ""GPA"" = COALESCE(sc.gpa, 0)
                FROM sem_calc sc
                WHERE sr.""StudentId"" = sc.""StudentId"" AND sr.""SemesterId"" = sc.""SemesterId"";
            ";
            var p1 = cmd.CreateParameter(); p1.ParameterName = "@stdId"; p1.Value = stdDbId; cmd.Parameters.Add(p1);
            var p2 = cmd.CreateParameter(); p2.ParameterName = "@semId"; p2.Value = request.Dto.SemesterId; cmd.Parameters.Add(p2);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }

        return true;
    }
}
