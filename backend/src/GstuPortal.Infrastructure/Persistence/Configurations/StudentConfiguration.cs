using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GstuPortal.Infrastructure.Persistence.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("students");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.StudentId)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(s => s.StudentId)
            .IsUnique();

        builder.Property(s => s.StudentName)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasMany(s => s.Semesters)
            .WithOne(sem => sem.Student)
            .HasForeignKey(sem => sem.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
