using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<SemesterResult> SemesterResults => Set<SemesterResult>();
    public DbSet<CourseGrade> CourseGrades => Set<CourseGrade>();
    public DbSet<BatchThought> BatchThoughts => Set<BatchThought>();
    public DbSet<LandingPhoto> LandingPhotos => Set<LandingPhoto>();

    public System.Data.Common.DbConnection GetConnection() => Database.GetDbConnection();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
