using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GstuPortal.Infrastructure.Persistence.Configurations;

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("user_sessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.RefreshTokenHash)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(s => s.RefreshTokenHash);

        builder.Property(s => s.DeviceInfo)
            .HasMaxLength(255);

        builder.Property(s => s.IpAddress)
            .HasMaxLength(50);

        builder.Property(s => s.ReplacedAt);
    }
}
