using System.Data;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Admin.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Queries;

public record GetAllStudentsAdminQuery() : IRequest<List<AdminStudentDto>>;

public class GetAllStudentsAdminQueryHandler : IRequestHandler<GetAllStudentsAdminQuery, List<AdminStudentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllStudentsAdminQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminStudentDto>> Handle(GetAllStudentsAdminQuery request, CancellationToken cancellationToken)
    {
        var conn = _context.GetConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        var list = new List<AdminStudentDto>();
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
            SELECT ""Id"", ""StudentId"", ""Name"", total_credits, cgpa, rank
            FROM student_cgpa
            ORDER BY rank, ""StudentId"";
        ";

        using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new AdminStudentDto(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.GetString(2),
                Convert.ToInt32(Math.Round(reader.GetDecimal(3))),
                Convert.ToDouble(reader.GetDecimal(4)),
                Convert.ToInt32(reader.GetInt64(5))
            ));
        }

        return list;
    }
}
