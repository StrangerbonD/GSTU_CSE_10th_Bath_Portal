using GstuPortal.Application.Features.Auth.DTOs;

namespace GstuPortal.Application.Features.Auth.Commands.VerifyEmail;

public record VerifyEmailResult(
    bool Success,
    string Message,
    string? Token = null,
    string? RefreshToken = null,
    UserDto? User = null);
