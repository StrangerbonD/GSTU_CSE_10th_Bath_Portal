using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GstuPortal.Infrastructure.Persistence.Configurations;

public class CourseGradeConfiguration : IEntityTypeConfiguration<CourseGrade>
{
    public void Configure(EntityTypeBuilder<CourseGrade> builder)
    {
        builder.ToTable("course_grades");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CourseCode)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(c => c.CourseTitle)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.GradeLetter)
            .IsRequired()
            .HasMaxLength(10);
    }
}
