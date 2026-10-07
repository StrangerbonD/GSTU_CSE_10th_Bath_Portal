namespace GstuPortal.Application.Features.Auth.DTOs;

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    UserDto User,
    string? Otp = null);
