using GstuPortal.Domain.Common;

namespace GstuPortal.Domain.Entities;

public class BatchThought : BaseEntity
{
    public Guid? UserId { get; private set; }
    public string AuthorName { get; private set; } = string.Empty;
    public string RoleTitle { get; private set; } = "GSTU CSE 10th Batch";
    public string Quote { get; private set; } = string.Empty;
    public string? AvatarUrl { get; private set; }
    public bool IsApproved { get; private set; } = false;

    // Navigation
    public User? User { get; private set; }

    private BatchThought() { } // EF Core

    public BatchThought(
        string authorName,
        string quote,
        string? avatarUrl = null,
        Guid? userId = null,
        string roleTitle = "GSTU CSE 10th Batch",
        bool isApproved = false)
    {
        AuthorName = authorName.Trim();
        Quote = quote.Trim();
        AvatarUrl = avatarUrl;
        UserId = userId;
        RoleTitle = string.IsNullOrWhiteSpace(roleTitle) ? "GSTU CSE 10th Batch" : roleTitle.Trim();
        IsApproved = isApproved;
    }

    public void UpdateApproval(bool isApproved)
    {
        IsApproved = isApproved;
        SetUpdated();
    }

    public void UpdateContent(string quote, string? avatarUrl = null, string? roleTitle = null)
    {
        Quote = quote.Trim();
        if (avatarUrl != null) AvatarUrl = avatarUrl;
        if (!string.IsNullOrWhiteSpace(roleTitle)) RoleTitle = roleTitle.Trim();
        IsApproved = false;
        SetUpdated();
    }
}
