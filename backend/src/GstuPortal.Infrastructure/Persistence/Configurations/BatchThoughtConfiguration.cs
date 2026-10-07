using GstuPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GstuPortal.Infrastructure.Persistence.Configurations;

public class BatchThoughtConfiguration : IEntityTypeConfiguration<BatchThought>
{
    public void Configure(EntityTypeBuilder<BatchThought> builder)
    {
        builder.ToTable("batch_thoughts");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.AuthorName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.RoleTitle)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.Quote)
            .IsRequired();

        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
