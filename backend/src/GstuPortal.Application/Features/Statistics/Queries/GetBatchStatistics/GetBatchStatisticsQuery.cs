using System.Data;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Statistics.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Statistics.Queries.GetBatchStatistics;

public record GetBatchStatisticsQuery : IRequest<BatchStatisticsDto>;

public class GetBatchStatisticsQueryHandler : IRequestHandler<GetBatchStatisticsQuery, BatchStatisticsDto>
{
    private readonly IApplicationDbContext _context;

    public GetBatchStatisticsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BatchStatisticsDto> Handle(GetBatchStatisticsQuery request, CancellationToken cancellationToken)
    {
        var conn = _context.GetConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        var leaderboard = new List<LeaderboardItemDto>();

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
                SELECT rank, ""StudentId"", ""Name"", cgpa
                FROM student_cgpa
                ORDER BY rank, ""StudentId"";
            ";

            using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var rank = Convert.ToInt32(reader.GetInt64(0));
                var studentId = reader.GetString(1);
                var studentName = reader.GetString(2);
                var cgpa = Convert.ToDouble(reader.GetDecimal(3));
                var isDistinction = cgpa >= 3.75;

                leaderboard.Add(new LeaderboardItemDto(
                    Rank: rank,
                    StudentId: studentId,
                    StudentName: studentName,
                    Cgpa: cgpa,
                    Ygpa: cgpa,
                    IsDistinction: isDistinction
                ));
            }
        }

        if (!leaderboard.Any())
        {
            return new BatchStatisticsDto(0, 0, 0, 0, 0, 0, new List<LeaderboardItemDto>());
        }

        var total = leaderboard.Count;
        var highest = leaderboard.First().Cgpa;
        var lowest = leaderboard.Last().Cgpa;
        var average = Math.Round(leaderboard.Average(s => s.Cgpa), 3);
        var distinctionCount = leaderboard.Count(s => s.IsDistinction);

        // Median calculation
        var sortedByCgpa = leaderboard.OrderBy(x => x.Cgpa).ToList();
        double median = total % 2 == 1
            ? sortedByCgpa[total / 2].Cgpa
            : Math.Round((sortedByCgpa[(total / 2) - 1].Cgpa + sortedByCgpa[total / 2].Cgpa) / 2.0, 3);

        return new BatchStatisticsDto(
            TotalStudents: total,
            HighestCGPA: highest,
            AverageCGPA: average,
            LowestCGPA: lowest,
            MedianCGPA: median,
            DistinctionCount: distinctionCount,
            Leaderboard: leaderboard);
    }
}
