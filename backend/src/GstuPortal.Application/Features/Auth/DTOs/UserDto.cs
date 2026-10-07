namespace GstuPortal.Application.Features.Auth.DTOs;

public record UserDto(
    Guid Id,
    string Username,
    string FullName,
    string Email,
    string Role,
    string? StudentId,
    string? AvatarUrl,
    string? StatusMessage,
    bool IsVerifiedBatchStudent,
    string ClaimStatus,
    bool IsEmailVerified = false,
    bool IsCr = false,
    string CrClaimStatus = "None",
    string? CrTenure = null,
    string? CrThought = null,
    bool IsActive = true,
    string? PendingCrTenure = null,
    string? PendingCrThought = null,
    string CrThoughtStatus = "None");
