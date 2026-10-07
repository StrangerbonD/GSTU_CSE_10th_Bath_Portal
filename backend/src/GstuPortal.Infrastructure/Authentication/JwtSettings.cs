using Microsoft.Extensions.Configuration;

namespace GstuPortal.Infrastructure.Authentication;

/// <summary>
/// Single source of truth for JWT configuration. There is intentionally NO fallback secret:
/// if the secret is missing or too short the application refuses to start.
/// </summary>
public sealed record JwtSettings(string Secret, string Issuer, string Audience, int ExpiryMinutes)
{
    public const int MinSecretLength = 32;

    public static JwtSettings From(IConfiguration configuration)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? configuration["JwtSettings:Secret"];

        if (string.IsNullOrWhiteSpace(secret) || secret.Length < MinSecretLength)
        {
            throw new InvalidOperationException(
                $"JwtSettings:Secret (or JWT_SECRET env var) must be configured and at least {MinSecretLength} characters. " +
                "For local development use: dotnet user-secrets set \"JwtSettings:Secret\" \"<random value>\"");
        }

        var issuer = configuration["JwtSettings:Issuer"] ?? "GstuPortalBackend";
        var audience = configuration["JwtSettings:Audience"] ?? "GstuPortalClient";
        var expiry = int.TryParse(configuration["JwtSettings:ExpiryMinutes"], out var m) && m > 0 ? m : 15;

        return new JwtSettings(secret, issuer, audience, expiry);
    }
}
