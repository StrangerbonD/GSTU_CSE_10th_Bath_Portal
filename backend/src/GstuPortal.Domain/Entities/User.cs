using GstuPortal.Domain.Common;
using GstuPortal.Domain.Enums;

namespace GstuPortal.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; } = UserRole.User;
    public string? StudentId { get; private set; }
    public string? AvatarUrl { get; private set; }
    public string? StatusMessage { get; private set; }
    public bool IsVerifiedBatchStudent { get; private set; } = false;
    public ClaimStatus ClaimStatus { get; private set; } = ClaimStatus.None;
    public string? RecognitionNote { get; private set; }

    // Account status
    public bool IsActive { get; private set; } = true;

    // Email verification
    public bool IsEmailVerified { get; private set; } = false;
    public string? EmailVerificationOtp { get; private set; }
    public DateTime? EmailVerificationOtpExpiresAt { get; private set; }
    public int EmailVerificationOtpAttempts { get; private set; } = 0;

    // Class Representative (CR) Fields
    public bool IsCr { get; private set; } = false;
    public ClaimStatus CrClaimStatus { get; private set; } = ClaimStatus.None;
    public string? CrClaimNote { get; private set; }
    public string? CrTenure { get; private set; }
    public string? CrThought { get; private set; }
    public string? PendingCrTenure { get; private set; }
    public string? PendingCrThought { get; private set; }
    public ClaimStatus CrThoughtStatus { get; private set; } = ClaimStatus.None;

    // Navigation property
    public ICollection<UserSession> Sessions { get; private set; } = new List<UserSession>();

    private User() { } // For EF Core

    public User(
        string username,
        string fullName,
        string email,
        string passwordHash,
        UserRole role = UserRole.User,
        string? studentId = null,
        string? avatarUrl = null)
    {
        Username = username.Trim();
        FullName = fullName.Trim();
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        Role = role;
        StudentId = studentId?.Trim().ToUpperInvariant();
        AvatarUrl = avatarUrl;
    }

    public static string HashOtp(string otp)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(otp.Trim()));
        return Convert.ToHexString(bytes);
    }

    public void SetVerificationOtp(string rawOtp, DateTime expiresAt)
    {
        EmailVerificationOtp = HashOtp(rawOtp);
        EmailVerificationOtpExpiresAt = expiresAt;
        EmailVerificationOtpAttempts = 0;
        SetUpdated();
    }

    public (bool Success, string Message, int RemainingAttempts) VerifyEmailOtp(string rawOtp)
    {
        if (string.IsNullOrWhiteSpace(EmailVerificationOtp) || !EmailVerificationOtpExpiresAt.HasValue)
        {
            return (false, "No active verification code found. Please request a new code.", 0);
        }

        if (DateTime.UtcNow > EmailVerificationOtpExpiresAt.Value)
        {
            return (false, "Verification code has expired. Please request a new code.", 0);
        }

        if (EmailVerificationOtpAttempts >= 5)
        {
            EmailVerificationOtp = null;
            EmailVerificationOtpExpiresAt = null;
            EmailVerificationOtpAttempts = 0;
            SetUpdated();
            return (false, "Too many incorrect attempts. This verification code has been permanently locked. Please request a new code.", 0);
        }

        var incomingHash = HashOtp(rawOtp);
        bool isMatch = System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(EmailVerificationOtp.Trim()),
            System.Text.Encoding.UTF8.GetBytes(incomingHash.Trim())
        );

        if (!isMatch)
        {
            EmailVerificationOtpAttempts++;
            SetUpdated();

            if (EmailVerificationOtpAttempts >= 5)
            {
                EmailVerificationOtp = null;
                EmailVerificationOtpExpiresAt = null;
                EmailVerificationOtpAttempts = 0;
                return (false, "Too many incorrect attempts. This verification code has been permanently locked. Please request a new code.", 0);
            }

            int remaining = 5 - EmailVerificationOtpAttempts;
            return (false, $"Invalid verification code. You have {remaining} attempt(s) remaining.", remaining);
        }

        // Match verified successfully
        IsEmailVerified = true;
        EmailVerificationOtp = null;
        EmailVerificationOtpExpiresAt = null;
        EmailVerificationOtpAttempts = 0;
        SetUpdated();
        return (true, "Email verified successfully!", 0);
    }

    public void MarkEmailAsVerified()
    {
        IsEmailVerified = true;
        EmailVerificationOtp = null;
        EmailVerificationOtpExpiresAt = null;
        SetUpdated();
    }

    public void UpdateProfile(string fullName, string? avatarUrl)
    {
        FullName = fullName.Trim();
        if (!string.IsNullOrWhiteSpace(avatarUrl)) AvatarUrl = avatarUrl.Trim();
        SetUpdated();
    }

    public void ChangePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
        SetUpdated();
    }

    public void SetStatusMessage(string message)
    {
        StatusMessage = message.Trim();
        SetUpdated();
    }

    public void SubmitClaim(string studentId, string recognitionNote)
    {
        StudentId = studentId.Trim().ToUpperInvariant();
        RecognitionNote = recognitionNote.Trim();
        ClaimStatus = ClaimStatus.Pending;
        SetUpdated();
    }

    public void ApproveClaim()
    {
        IsVerifiedBatchStudent = true;
        ClaimStatus = ClaimStatus.Approved;
        Role = UserRole.Student;
        SetUpdated();
    }

    public void RejectClaim()
    {
        ClaimStatus = ClaimStatus.Rejected;
        SetUpdated();
    }

    public void SetRole(UserRole newRole)
    {
        Role = newRole;
        SetUpdated();
    }

    public void SetActiveStatus(bool isActive)
    {
        IsActive = isActive;
        SetUpdated();
    }

    public void SubmitCrClaim(string note)
    {
        CrClaimNote = note.Trim();
        CrClaimStatus = ClaimStatus.Pending;
        SetUpdated();
    }

    public void ApproveCrClaim()
    {
        IsCr = true;
        CrClaimStatus = ClaimStatus.Approved;
        SetUpdated();
    }

    public void RejectCrClaim()
    {
        CrClaimStatus = ClaimStatus.Rejected;
        SetUpdated();
    }

    public void UpdateCrProfile(string tenure, string thought)
    {
        CrTenure = tenure.Trim();
        CrThought = thought.Trim();
        SetUpdated();
    }

    public void SubmitCrThought(string tenure, string thought)
    {
        PendingCrTenure = tenure.Trim();
        PendingCrThought = thought.Trim();
        CrThoughtStatus = ClaimStatus.Pending;
        SetUpdated();
    }

    public void ApproveCrThought()
    {
        if (!string.IsNullOrWhiteSpace(PendingCrTenure))
        {
            CrTenure = PendingCrTenure;
        }
        if (!string.IsNullOrWhiteSpace(PendingCrThought))
        {
            CrThought = PendingCrThought;
        }
        PendingCrTenure = null;
        PendingCrThought = null;
        CrThoughtStatus = ClaimStatus.Approved;
        SetUpdated();
    }

    public void RejectCrThought()
    {
        PendingCrTenure = null;
        PendingCrThought = null;
        CrThoughtStatus = ClaimStatus.Rejected;
        SetUpdated();
    }
}
