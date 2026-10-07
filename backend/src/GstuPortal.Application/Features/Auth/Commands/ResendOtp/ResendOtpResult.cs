namespace GstuPortal.Application.Features.Auth.Commands.ResendOtp;

public record ResendOtpResult(bool Success, string Message, string? Otp = null);
