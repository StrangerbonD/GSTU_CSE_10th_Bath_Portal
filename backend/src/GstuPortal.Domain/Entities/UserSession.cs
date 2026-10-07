using GstuPortal.Domain.Common;

namespace GstuPortal.Domain.Entities;

public class UserSession : BaseEntity
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    public string RefreshTokenHash { get; private set; } = string.Empty;
    public string? DeviceInfo { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool IsRevoked { get; private set; } = false;
    public DateTime? ReplacedAt { get; private set; }

    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;

    private UserSession() { } // For EF Core

    public UserSession(
        Guid userId,
        string refreshTokenHash,
        DateTime expiresAt,
        string? deviceInfo = null,
        string? ipAddress = null)
    {
        UserId = userId;
        RefreshTokenHash = refreshTokenHash;
        ExpiresAt = expiresAt;
        DeviceInfo = deviceInfo;
        IpAddress = ipAddress;
    }

    public void Revoke()
    {
        IsRevoked = true;
        SetUpdated();
    }

    /// <summary>Marks this session as replaced by a freshly issued refresh token (rotation).</summary>
    public void Rotate()
    {
        IsRevoked = true;
        ReplacedAt = DateTime.UtcNow;
        SetUpdated();
    }
}
