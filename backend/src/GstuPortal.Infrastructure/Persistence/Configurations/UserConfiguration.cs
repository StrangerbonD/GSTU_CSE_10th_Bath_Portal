using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GstuPortal.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Username)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(u => u.Username)
            .IsUnique();

        builder.Property(u => u.FullName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.Email)
            .HasMaxLength(150)
            .IsRequired();

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired();

        builder.Property(u => u.StudentId)
            .HasMaxLength(30);

        builder.HasIndex(u => u.StudentId)
            .IsUnique()
            .HasFilter("\"IsVerifiedBatchStudent\" = true AND \"StudentId\" IS NOT NULL");

        builder.Property(u => u.EmailVerificationOtp)
            .HasMaxLength(128);

        builder.Property(u => u.EmailVerificationOtpAttempts)
            .HasDefaultValue(0);

        builder.Property(u => u.CrTenure)
            .HasMaxLength(100);

        builder.Property(u => u.PendingCrTenure)
            .HasMaxLength(100);

        builder.Property(u => u.IsActive)
            .HasDefaultValue(true);

        builder.HasMany(u => u.Sessions)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
