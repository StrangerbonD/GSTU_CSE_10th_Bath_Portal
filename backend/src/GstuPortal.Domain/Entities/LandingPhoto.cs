using GstuPortal.Domain.Common;

namespace GstuPortal.Domain.Entities;

public class LandingPhoto : BaseEntity
{
    public string ImageUrl { get; private set; } = string.Empty;
    public string Title { get; private set; } = "GSTU CSE 10th Batch Family";
    public string Subtitle { get; private set; } = "Department of Computer Science & Engineering";
    public string BadgeText { get; private set; } = "Memories Forever";
    public int DisplayOrder { get; private set; } = 1;
    public bool IsActive { get; private set; } = true;

    private LandingPhoto() { } // EF Core

    public LandingPhoto(
        string imageUrl,
        string title = "GSTU CSE 10th Batch Family",
        string subtitle = "Department of Computer Science & Engineering",
        string badgeText = "Memories Forever",
        int displayOrder = 1,
        bool isActive = true)
    {
        ImageUrl = imageUrl.Trim();
        Title = string.IsNullOrWhiteSpace(title) ? "GSTU CSE 10th Batch Family" : title.Trim();
        Subtitle = string.IsNullOrWhiteSpace(subtitle) ? "Department of Computer Science & Engineering" : subtitle.Trim();
        BadgeText = string.IsNullOrWhiteSpace(badgeText) ? "Memories Forever" : badgeText.Trim();
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void Update(string imageUrl, string title, string subtitle, string badgeText, int displayOrder, bool isActive)
    {
        ImageUrl = imageUrl.Trim();
        Title = string.IsNullOrWhiteSpace(title) ? "GSTU CSE 10th Batch Family" : title.Trim();
        Subtitle = string.IsNullOrWhiteSpace(subtitle) ? "Department of Computer Science & Engineering" : subtitle.Trim();
        BadgeText = string.IsNullOrWhiteSpace(badgeText) ? "Memories Forever" : badgeText.Trim();
        DisplayOrder = displayOrder;
        IsActive = isActive;
        SetUpdated();
    }
}
