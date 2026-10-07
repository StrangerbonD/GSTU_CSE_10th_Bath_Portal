namespace GstuPortal.Application.Features.Users.DTOs;

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
}
