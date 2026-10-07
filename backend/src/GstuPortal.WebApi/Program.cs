using System.Text;
using System.Threading.RateLimiting;
using GstuPortal.Application;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Infrastructure;
using GstuPortal.Infrastructure.Authentication;
using GstuPortal.Infrastructure.Persistence;
using GstuPortal.Infrastructure.Seed;
using GstuPortal.WebApi.Middlewares;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Clean Architecture Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// 2. Configure ASP.NET Core Built-in Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict rate limiter for Auth endpoints (login, register, resend-otp, verify-email)
    options.AddPolicy("auth-policy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // General API rate limiter
    options.AddPolicy("api-policy", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueLimit = 0
            }));
});

// 3. Add Web API Services
builder.Services.AddMemoryCache();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 4. Configure CORS (Allows Next.js frontend on localhost:3000 with credentials/cookies)
// 4. Configure CORS (Allows frontend with credentials/cookies)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 5. Configure JWT Authentication
var jwtSettings = JwtSettings.From(builder.Configuration);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Real-time security: immediately invalidate tokens of banned users and check role changes
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<GstuPortal.Application.Common.Interfaces.IApplicationDbContext>();
                var userIdStr = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? context.Principal?.FindFirst("id")?.Value
                    ?? context.Principal?.FindFirst("sub")?.Value;

                if (Guid.TryParse(userIdStr, out var userId))
                {
                    var userRecord = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                        System.Linq.Queryable.Select(
                            System.Linq.Queryable.Where(dbContext.Users, u => u.Id == userId),
                            u => new { u.IsActive, Role = u.Role.ToString() }));

                    if (userRecord == null || !userRecord.IsActive)
                    {
                        context.Fail("User account has been deactivated, banned, or not found.");
                        return;
                    }

                    var tokenRole = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                    if (!string.IsNullOrEmpty(tokenRole) && !string.Equals(tokenRole, userRecord.Role, StringComparison.OrdinalIgnoreCase))
                    {
                        context.Fail("User permissions have changed. Please log in again.");
                    }
                }
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Secure by Default: All endpoints require authentication unless explicitly marked with [AllowAnonymous]
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

// 5. Configure HTTP request pipeline
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedHeadersOptions.KnownNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

// Standard security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Enforce general API rate limiter on all controllers by default
app.MapControllers().RequireRateLimiting("api-policy");

// Health check endpoint
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "GSTU CSE 10th Batch Portal Web API",
    architecture = "Clean Architecture (.NET 9 + PostgreSQL)",
    timestamp = DateTime.UtcNow
})).AllowAnonymous();

// Email diagnostic test endpoint (safe, masked, allows testing Brevo/Resend from Render directly)
app.MapGet("/api/test-email", async (
    string? to,
    IConfiguration configuration,
    CancellationToken cancellationToken) =>
{
    var targetEmail = !string.IsNullOrWhiteSpace(to) ? to.Trim() : "bondhondas20cse016@gmail.com";
    var result = new Dictionary<string, object?>();

    var brevoKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? configuration["EmailSettings:BrevoApiKey"];
    var resendKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") ?? configuration["EmailSettings:ResendApiKey"];
    var rawResendFrom = Environment.GetEnvironmentVariable("RESEND_FROM") ?? configuration["EmailSettings:ResendFrom"];
    var resendFrom = (!string.IsNullOrWhiteSpace(rawResendFrom) && !rawResendFrom.Contains("@gmail.com", StringComparison.OrdinalIgnoreCase))
        ? rawResendFrom.Trim()
        : "GSTU CSE 10th Batch Portal <onboarding@resend.dev>";
    var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? configuration["EmailSettings:SmtpHost"];
    var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? configuration["EmailSettings:SmtpUser"];
    var smtpPort = Environment.GetEnvironmentVariable("SMTP_PORT") ?? configuration["EmailSettings:SmtpPort"];
    var fromEmail = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? configuration["EmailSettings:FromEmail"];

    result["targetRecipient"] = targetEmail;
    result["brevoKeyConfigured"] = !string.IsNullOrWhiteSpace(brevoKey);
    result["resendKeyConfigured"] = !string.IsNullOrWhiteSpace(resendKey);
    result["resendKeyPrefix"] = !string.IsNullOrWhiteSpace(resendKey) ? (resendKey.Length > 7 ? resendKey[..7] + "..." : "short") : "none";
    result["resendFromAddress"] = resendFrom;
    result["fromEmail"] = fromEmail;
    result["smtpHostConfigured"] = !string.IsNullOrWhiteSpace(smtpHost);
    result["smtpUser"] = smtpUser;
    result["smtpPort"] = smtpPort;

    if (!string.IsNullOrWhiteSpace(resendKey))
    {
        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", resendKey.Trim());
            var payload = new
            {
                from = resendFrom,
                to = new[] { targetEmail },
                subject = "GSTU Test Email - Resend API",
                html = "<p>This is a test verification email from GSTU CSE 10th Batch Portal.</p>"
            };
            var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var res = await httpClient.PostAsync("https://api.resend.com/emails", content, cancellationToken);
            var resBody = await res.Content.ReadAsStringAsync(cancellationToken);
            result["resendStatusCode"] = (int)res.StatusCode;
            result["resendResponseBody"] = resBody;
            result["resendSuccess"] = res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            result["resendException"] = ex.Message;
        }
    }

    if (!string.IsNullOrWhiteSpace(brevoKey))
    {
        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
            httpClient.DefaultRequestHeaders.Add("api-key", brevoKey.Trim());
            var senderEmail = Environment.GetEnvironmentVariable("BREVO_SENDER_EMAIL") ??
                              fromEmail ??
                              "bondhondas20cse016@gmail.com";
            var payload = new
            {
                sender = new { name = "GSTU CSE 10th Batch Portal", email = senderEmail.Trim() },
                to = new[] { new { email = targetEmail, name = "Tester" } },
                subject = "GSTU Test Email - Brevo API",
                htmlContent = "<p>This is a test verification email from GSTU CSE 10th Batch Portal via Brevo.</p>"
            };
            var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var res = await httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content, cancellationToken);
            var resBody = await res.Content.ReadAsStringAsync(cancellationToken);
            result["brevoStatusCode"] = (int)res.StatusCode;
            result["brevoResponseBody"] = resBody;
            result["brevoSuccess"] = res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            result["brevoException"] = ex.Message;
        }
    }

    return Results.Ok(result);
}).AllowAnonymous();

// 6. Database Migration & Seed on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var hasher = services.GetRequiredService<IPasswordHasher>();

        logger.LogInformation("Applying database migrations and seeding initial data...");
        await context.Database.EnsureCreatedAsync();
        await DatabaseSeeder.SeedAsync(context, hasher);
        logger.LogInformation("Database initialized and seeded successfully.");
    }
    catch (Exception ex)
    {
        if (app.Environment.IsDevelopment())
        {
            logger.LogWarning("PostgreSQL database connection was not established: {Message}. (Ensure PostgreSQL is running on localhost:5432 or update DefaultConnection in appsettings.json)", ex.Message);
        }
        else
        {
            logger.LogCritical(ex, "FATAL: Database connection failed in production.");
            throw;
        }
    }
}

app.Run();

public partial class Program { }
