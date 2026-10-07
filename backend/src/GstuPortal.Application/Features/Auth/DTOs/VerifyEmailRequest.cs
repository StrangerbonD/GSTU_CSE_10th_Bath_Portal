namespace GstuPortal.Application.Features.Auth.DTOs;

public class VerifyEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
