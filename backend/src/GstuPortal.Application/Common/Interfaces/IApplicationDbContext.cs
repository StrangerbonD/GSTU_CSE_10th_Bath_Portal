using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserSession> UserSessions { get; }
    DbSet<Student> Students { get; }
    DbSet<SemesterResult> SemesterResults { get; }
    DbSet<CourseGrade> CourseGrades { get; }
    DbSet<BatchThought> BatchThoughts { get; }
    DbSet<LandingPhoto> LandingPhotos { get; }

    System.Data.Common.DbConnection GetConnection();

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
