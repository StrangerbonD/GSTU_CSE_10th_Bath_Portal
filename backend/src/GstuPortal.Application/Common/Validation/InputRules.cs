using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;

namespace GstuPortal.Application.Common.Validation;

/// <summary>
/// Server-side input rules. The React forms validate too, but the API must never trust the client.
/// Violations throw <see cref="ArgumentException"/>, which the exception middleware maps to HTTP 400.
/// </summary>
public static partial class InputRules
{
    public const int MinPasswordLength = 8;
    public const int MaxPasswordBytes = 72; // BCrypt silently truncates beyond 72 bytes

    [GeneratedRegex(@"^[A-Za-z0-9_.\-]{3,32}$")]
    private static partial Regex UsernameRegex();

    [GeneratedRegex(@"^\d{2}[A-Za-z]{2,5}\d{3}$")]
    private static partial Regex StudentIdRegex();

    [GeneratedRegex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")]
    private static partial Regex StrongPasswordRegex();

    public static void ValidatePassword(string? password)
    {
        if (string.IsNullOrEmpty(password) || !StrongPasswordRegex().IsMatch(password))
            throw new ArgumentException("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).");

        if (Encoding.UTF8.GetByteCount(password) > MaxPasswordBytes)
            throw new ArgumentException($"Password must be at most {MaxPasswordBytes} bytes long.");
    }

    public static void ValidateUsername(string? username)
    {
        if (string.IsNullOrWhiteSpace(username) || !UsernameRegex().IsMatch(username.Trim()))
            throw new ArgumentException("Username must be 3-32 characters (letters, digits, '_', '.', '-').");
    }

    public static void ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254 ||
            !MailAddress.TryCreate(email.Trim(), out var addr) ||
            !string.Equals(addr.Address, email.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("A valid email address is required.");
    }

    public static void ValidateFullName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Trim().Length > 100)
            throw new ArgumentException("Full name is required and must be at most 100 characters.");
    }

    /// <summary>StudentId is optional at registration; when present it must look like 20CSE016.</summary>
    public static void ValidateOptionalStudentId(string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId)) return;
        if (!StudentIdRegex().IsMatch(studentId.Trim()))
            throw new ArgumentException("Student ID format is invalid (expected something like 20CSE016).");
    }
}
