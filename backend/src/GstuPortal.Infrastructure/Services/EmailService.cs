using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using GstuPortal.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GstuPortal.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public bool IsConfigured
    {
        get
        {
            var brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? _configuration["EmailSettings:BrevoApiKey"];
            var resendApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") ?? _configuration["EmailSettings:ResendApiKey"];
            var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? _configuration["EmailSettings:SmtpHost"];
            var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? _configuration["EmailSettings:SmtpUser"];
            var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS") ?? _configuration["EmailSettings:SmtpPass"];

            return !string.IsNullOrWhiteSpace(brevoApiKey) ||
                   !string.IsNullOrWhiteSpace(resendApiKey) ||
                   (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(smtpUser) && !string.IsNullOrWhiteSpace(smtpPass));
        }
    }

    public async Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken = default)
    {
        // 1. Always log OTP to server console so the admin/user can always find it in Render logs
        _logger.LogInformation("""

        ======================================================================
        ✉️  [GSTU PORTAL EMAIL VERIFICATION CODE]
        To: {Email} ({FullName})
        Subject: GSTU CSE 10th Batch - Email Verification Code
        ----------------------------------------------------------------------
        Your 6-Digit Verification Code (OTP) is: [ {Otp} ]
        (This code will expire in 15 minutes)
        ======================================================================

        """, toEmail, fullName, otp);

        var safeFullName = WebUtility.HtmlEncode(fullName);
        var htmlBody = $"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #0e3b2e; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.5px;">Welcome to GSTU CSE 10th Batch Portal</h2>
            <p style="color: #1e293b; font-size: 15px; margin-bottom: 12px;">Hello <strong>{safeFullName}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Please use the following 6-digit verification code to complete your email verification:</p>
            
            <div style="background-color: #f0fdf4; border: 1px dashed #16a34a; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #166534; display: inline-block;">{otp}</span>
            </div>
            
            <p style="color: #dc2626; font-size: 13px; font-weight: 700; margin-bottom: 6px;">
                Don't share this code with anyone.
            </p>
            <p style="color: #64748b; font-size: 13px; margin-top: 2px; margin-bottom: 28px;">
                (This code will expire in 15 minutes)
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                Best regards,<br/>
                <strong>GSTU CSE 10th Batch</strong><br/>
                <span style="color: #64748b; font-size: 12px;">Department of Computer Science & Engineering</span>
            </p>
        </div>
        """;

        // 2. High-speed HTTP API via Brevo (Sendinblue) - 300 free emails/day, no credit card, HTTPS port 443
        var brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? _configuration["EmailSettings:BrevoApiKey"];
        var senderEmail = Environment.GetEnvironmentVariable("BREVO_SENDER_EMAIL") ??
                          Environment.GetEnvironmentVariable("FROM_EMAIL") ??
                          _configuration["EmailSettings:FromEmail"] ??
                          "bondhondas20cse016@gmail.com";

        if (!string.IsNullOrWhiteSpace(brevoApiKey))
        {
            try
            {
                using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(6) };
                httpClient.DefaultRequestHeaders.Add("api-key", brevoApiKey.Trim());
                var payload = new
                {
                    sender = new { name = "GSTU CSE 10th Batch Portal", email = senderEmail.Trim() },
                    to = new[] { new { email = toEmail.Trim(), name = safeFullName } },
                    subject = "GSTU CSE 10th Batch - Email Verification Code",
                    htmlContent = htmlBody
                };
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var res = await httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content, cancellationToken);
                if (res.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Verification email dispatched successfully via Brevo API to {Email}", toEmail);
                    return;
                }
                else
                {
                    var err = await res.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Brevo API warning: {StatusCode} {Error}", res.StatusCode, err);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Brevo API attempt failed: {Message}", ex.Message);
            }
        }

        // 3. High-speed HTTP API via Resend - Uses HTTPS port 443 which is NEVER blocked by Render
        var resendApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") ?? _configuration["EmailSettings:ResendApiKey"];
        if (!string.IsNullOrWhiteSpace(resendApiKey))
        {
            try
            {
                using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(6) };
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", resendApiKey.Trim());
                var resendFrom = Environment.GetEnvironmentVariable("RESEND_FROM") ?? "GSTU CSE 10th Batch Portal <onboarding@resend.dev>";
                var payload = new
                {
                    from = resendFrom,
                    to = new[] { toEmail.Trim() },
                    subject = "GSTU CSE 10th Batch - Email Verification Code",
                    html = htmlBody
                };
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var res = await httpClient.PostAsync("https://api.resend.com/emails", content, cancellationToken);
                if (res.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Verification email dispatched successfully via Resend API to {Email}", toEmail);
                    return;
                }
                else
                {
                    var err = await res.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("Resend API warning: {StatusCode} {Error}", res.StatusCode, err);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Resend API attempt failed: {Message}", ex.Message);
            }
        }

        // 4. Fallback: SMTP with a strict 4-second timeout to prevent server thread hang if outbound SMTP is blocked
        var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? _configuration["EmailSettings:SmtpHost"];
        var smtpPort = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? _configuration["EmailSettings:SmtpPort"], out var p) ? p : 587;
        var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? _configuration["EmailSettings:SmtpUser"];
        var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS") ?? _configuration["EmailSettings:SmtpPass"];
        var fromEmail = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? _configuration["EmailSettings:FromEmail"] ?? "no-reply@gstu.ac.bd";

        if (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(smtpUser) && !string.IsNullOrWhiteSpace(smtpPass))
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(4)); // Strict 4s timeout prevents request hanging

                var cleanPass = smtpPass?.Replace(" ", "").Trim() ?? string.Empty;
                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    Credentials = new NetworkCredential(smtpUser.Trim(), cleanPass),
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 4000
                };

                var fromAddress = new MailAddress(fromEmail.Trim(), "GSTU CSE 10th Batch Portal");
                var toAddress = new MailAddress(toEmail.Trim(), fullName);

                var message = new MailMessage(fromAddress, toAddress)
                {
                    Subject = "GSTU CSE 10th Batch - Email Verification Code",
                    Body = htmlBody,
                    IsBodyHtml = true,
                    Priority = MailPriority.High
                };

                await client.SendMailAsync(message, cts.Token);
                _logger.LogInformation("Verification email dispatched successfully via SMTP to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SMTP delivery attempt concluded ({Message}). OTP is recorded in server logs above.", ex.Message);
            }
        }
    }
}
