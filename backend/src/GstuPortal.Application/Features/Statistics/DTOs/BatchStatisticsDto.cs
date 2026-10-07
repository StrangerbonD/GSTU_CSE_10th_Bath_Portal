namespace GstuPortal.Application.Features.Statistics.DTOs;

public record LeaderboardItemDto(
    int Rank,
    string StudentId,
    string StudentName,
    double Cgpa,
    double Ygpa,
    bool IsDistinction);

public record BatchStatisticsDto(
    int TotalStudents,
    double HighestCGPA,
    double AverageCGPA,
    double LowestCGPA,
    double MedianCGPA,
    int DistinctionCount,
    List<LeaderboardItemDto> Leaderboard);
