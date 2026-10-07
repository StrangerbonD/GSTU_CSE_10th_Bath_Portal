namespace GstuPortal.Application.Features.Auth.DTOs;

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string Password { get; set; } = string.Empty;
    public string? StudentId { get; set; }
}
