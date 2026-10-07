using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GstuPortal.Infrastructure.Persistence.Configurations;

public class SemesterResultConfiguration : IEntityTypeConfiguration<SemesterResult>
{
    public void Configure(EntityTypeBuilder<SemesterResult> builder)
    {
        builder.ToTable("semester_results");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.SemesterName)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasMany(s => s.Courses)
            .WithOne(c => c.SemesterResult)
            .HasForeignKey(c => c.SemesterResultId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
