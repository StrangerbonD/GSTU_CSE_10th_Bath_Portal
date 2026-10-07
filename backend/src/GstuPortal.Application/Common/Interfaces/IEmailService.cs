namespace GstuPortal.Application.Common.Interfaces;

public interface IEmailService
{
    bool IsConfigured { get; }
    Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken = default);
}
