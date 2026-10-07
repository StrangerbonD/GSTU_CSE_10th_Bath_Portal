using GstuPortal.Application.Features.Auth.Commands.Login;
using GstuPortal.Application.Features.Auth.Commands.Logout;
using GstuPortal.Application.Features.Auth.Commands.RefreshToken;
using GstuPortal.Application.Features.Auth.Commands.Register;
using GstuPortal.Application.Features.Auth.Commands.ResendOtp;
using GstuPortal.Application.Features.Auth.Commands.VerifyEmail;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using GstuPortal.Application.Features.Auth.DTOs;

namespace GstuPortal.WebApi.Controllers;

[EnableRateLimiting("auth-policy")]
public class AuthController : BaseApiController
{

    [AllowAnonymous]
    [HttpPost("login")]
    [HttpPost("/api/login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var username = request.Username.Trim();
        var password = request.Password;

        var deviceInfo = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await Mediator.Send(new LoginCommand(username, password, deviceInfo, ipAddress));

        SetRefreshTokenCookie(result.RefreshToken);

        return Ok(new
        {
            token = result.AccessToken,
            user = result.User
        });
    }

    [HttpGet("me")]
    [HttpGet("/api/auth/me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("id")?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Authentication required." });
        }

        var result = await Mediator.Send(new GstuPortal.Application.Features.Users.Queries.GetUserById.GetUserByIdQuery(userId));
        if (result == null) return NotFound(new { message = "User not found." });
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("register")]
    [HttpPost("/api/register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var rawUsername = !string.IsNullOrWhiteSpace(request.Username)
            ? request.Username
            : (!string.IsNullOrWhiteSpace(request.Email) ? request.Email.Split('@')[0] : "user");
        var username = rawUsername.Trim();
        var fullName = !string.IsNullOrWhiteSpace(request.FullName) ? request.FullName.Trim() : username;
        var email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : $"{username}@gstu.ac.bd";
        var password = request.Password;

        var deviceInfo = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await Mediator.Send(new RegisterCommand(username, fullName, email, password, request.StudentId, deviceInfo, ipAddress));

        return Ok(new
        {
            success = true,
            email = result.User?.Email ?? email,
            otp = result.Otp,
            message = "Account created successfully. A 6-digit verification code has been sent to your email."
        });
    }

    [AllowAnonymous]
    [HttpPost("verify-email")]
    [HttpPost("/api/verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var deviceInfo = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await Mediator.Send(new VerifyEmailCommand(request.Email, request.Code, deviceInfo, ipAddress));

        if (!result.Success)
        {
            return BadRequest(new
            {
                success = false,
                message = result.Message
            });
        }

        if (!string.IsNullOrEmpty(result.RefreshToken))
        {
            SetRefreshTokenCookie(result.RefreshToken);
        }

        return Ok(new
        {
            success = result.Success,
            message = result.Message,
            token = result.Token,
            user = result.User
        });
    }

    [AllowAnonymous]
    [HttpPost("resend-otp")]
    [HttpPost("/api/resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
    {
        var result = await Mediator.Send(new ResendOtpCommand(request.Email));
        if (!result.Success)
        {
            return BadRequest(new { success = false, message = result.Message });
        }
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [HttpPost("/api/refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest? bodyRequest)
    {
        // 1. Read from HttpOnly cookie first, then fallback to request body
        var rawToken = Request.Cookies["refreshToken"] ?? bodyRequest?.RefreshToken;

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return Unauthorized(new { message = "No refresh token provided." });
        }

        var deviceInfo = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await Mediator.Send(new RefreshTokenCommand(rawToken, deviceInfo, ipAddress));

        if (!string.IsNullOrEmpty(result.RefreshToken))
        {
            SetRefreshTokenCookie(result.RefreshToken);
        }

        return Ok(new
        {
            token = result.AccessToken,
            user = result.User
        });
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    [HttpPost("/api/logout")]
    public async Task<IActionResult> Logout()
    {
        var rawToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrWhiteSpace(rawToken))
        {
            await Mediator.Send(new LogoutCommand(rawToken));
        }

        var isHttps = Request.IsHttps || string.Equals(Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);

        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        });

        return Ok(new { message = "Logged out successfully." });
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var isHttps = Request.IsHttps || string.Equals(Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps, // Secure on HTTPS or reverse-proxy TLS termination
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(30)
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
