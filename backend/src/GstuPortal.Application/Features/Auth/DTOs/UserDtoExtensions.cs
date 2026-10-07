using GstuPortal.Domain.Entities;

namespace GstuPortal.Application.Features.Auth.DTOs;

public static class UserDtoExtensions
{
    public static UserDto ToDto(this User user)
    {
        return new UserDto(
            user.Id,
            user.Username,
            user.FullName,
            user.Email,
            user.Role.ToString(),
            user.StudentId,
            user.AvatarUrl,
            user.StatusMessage,
            user.IsVerifiedBatchStudent,
            user.ClaimStatus.ToString(),
            user.IsEmailVerified,
            user.IsCr,
            user.CrClaimStatus.ToString(),
            user.CrTenure,
            user.CrThought,
            user.IsActive,
            user.PendingCrTenure,
            user.PendingCrThought,
            user.CrThoughtStatus.ToString());
    }
}
