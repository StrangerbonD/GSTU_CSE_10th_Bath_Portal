using System.Security.Claims;
using GstuPortal.Application.Features.Users.Commands.SetStatusMessage;
using GstuPortal.Application.Features.Users.Commands.UpdateCrProfile;
using GstuPortal.Application.Features.Users.Commands.UpdateProfile;
using GstuPortal.Application.Features.Users.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GstuPortal.WebApi.Controllers;

public class UsersController : BaseApiController
{
    private bool IsCallerAuthorizedForUser(Guid targetUserId)
    {
        if (User.IsInRole("Admin")) return true;
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
        return Guid.TryParse(userIdStr, out var currentUserId) && currentUserId == targetUserId;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var result = await Mediator.Send(new GstuPortal.Application.Features.Users.Queries.GetUserById.GetUserByIdQuery(id));
        if (result == null) return NotFound(new { message = "User not found." });
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/avatar")]
    [HttpHead("{id:guid}/avatar")]
    public async Task<IActionResult> GetUserAvatar(Guid id)
    {
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";

        var result = await Mediator.Send(new GstuPortal.Application.Features.Users.Queries.GetUserById.GetUserByIdQuery(id));
        if (result == null || string.IsNullOrWhiteSpace(result.AvatarUrl))
        {
            var fallbackName = result?.FullName ?? "User";
            return Redirect($"https://ui-avatars.com/api/?name={Uri.EscapeDataString(fallbackName)}&background=0e3b2e&color=fff");
        }

        if (result.AvatarUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            var commaIdx = result.AvatarUrl.IndexOf(',');
            if (commaIdx > 0 && commaIdx < result.AvatarUrl.Length - 1)
            {
                var header = result.AvatarUrl[..commaIdx].ToLowerInvariant();
                var base64 = result.AvatarUrl[(commaIdx + 1)..];
                var mimeType = header.Split(';')[0].Replace("data:", "").Trim();

                // Whitelist only safe raster image MIME types (SVG blocked to prevent stored XSS)
                var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/jpg" };
                if (allowedMimeTypes.Contains(mimeType))
                {
                    // Size limit: Max ~10MB base64
                    if (base64.Length <= 10_000_000)
                    {
                        try
                        {
                            var bytes = Convert.FromBase64String(base64);
                            return File(bytes, mimeType);
                        }
                        catch
                        {
                            // Fallthrough if base64 decode fails
                        }
                    }
                }
            }
        }

        if (Uri.TryCreate(result.AvatarUrl, UriKind.Absolute, out var parsedUri) &&
            (parsedUri.Scheme == Uri.UriSchemeHttp || parsedUri.Scheme == Uri.UriSchemeHttps))
        {
            return Redirect(result.AvatarUrl);
        }

        return Redirect($"https://ui-avatars.com/api/?name={Uri.EscapeDataString(result.FullName)}&background=0e3b2e&color=fff");
    }

    [HttpPut("{id:guid}/profile")]
    public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] UpdateProfileRequest request)
    {
        if (!IsCallerAuthorizedForUser(id))
        {
            return Forbid();
        }

        var result = await Mediator.Send(new UpdateProfileCommand(
            id,
            request.FullName,
            request.AvatarUrl,
            request.CurrentPassword,
            request.NewPassword));

        return Ok(result);
    }

    [HttpPut("{id:guid}/status-message")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetStatusRequest request)
    {
        if (!IsCallerAuthorizedForUser(id))
        {
            return Forbid();
        }

        var result = await Mediator.Send(new SetStatusMessageCommand(id, request.StatusMessage));
        return Ok(result);
    }

    [HttpPut("{id:guid}/cr-profile")]
    public async Task<IActionResult> UpdateCrProfile(Guid id, [FromBody] UpdateCrProfileRequest request)
    {
        if (!IsCallerAuthorizedForUser(id))
        {
            return Forbid();
        }

        var result = await Mediator.Send(new UpdateCrProfileCommand(id, request.Tenure, request.Thought));
        return Ok(result);
    }

    [HttpPost("{id:guid}/cr-thought")]
    public async Task<IActionResult> SubmitCrThought(Guid id, [FromBody] UpdateCrProfileRequest request)
    {
        if (!IsCallerAuthorizedForUser(id))
        {
            return Forbid();
        }

        var result = await Mediator.Send(new GstuPortal.Application.Features.Users.Commands.SubmitCrThought.SubmitCrThoughtCommand(id, request.Tenure, request.Thought));
        return Ok(result);
    }
}
