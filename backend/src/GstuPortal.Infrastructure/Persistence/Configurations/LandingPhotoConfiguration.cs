using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GstuPortal.Infrastructure.Persistence.Configurations;

public class LandingPhotoConfiguration : IEntityTypeConfiguration<LandingPhoto>
{
    public void Configure(EntityTypeBuilder<LandingPhoto> builder)
    {
        builder.ToTable("landing_photos");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.ImageUrl)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Subtitle)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.BadgeText)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(p => p.IsActive)
            .IsRequired()
            .HasDefaultValue(true);
    }
}
