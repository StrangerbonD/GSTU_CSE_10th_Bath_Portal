using System.Security.Claims;
using GstuPortal.Application.Features.Thoughts.Commands.CreateBatchThought;
using GstuPortal.Application.Features.Thoughts.Commands.DeleteMyThought;
using GstuPortal.Application.Features.Thoughts.Queries.GetBatchThoughts;
using GstuPortal.Application.Features.Thoughts.Queries.GetMyThought;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GstuPortal.WebApi.Controllers;

[ApiController]
public class ThoughtsController : BaseApiController
{
    public record CreateThoughtRequest(string Quote, Guid? UserId = null);

    [AllowAnonymous]
    [HttpGet("/api/thoughts")]
    public async Task<IActionResult> GetThoughts()
    {
        var result = await Mediator.Send(new GetBatchThoughtsQuery());
        return Ok(result);
    }

    [Authorize]
    [HttpGet("/api/thoughts/my-thought")]
    public async Task<IActionResult> GetMyThought()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized();
        }

        var result = await Mediator.Send(new GetMyThoughtQuery(currentUserId));
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("/api/thoughts/my-thought")]
    public async Task<IActionResult> DeleteMyThought()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized();
        }

        await Mediator.Send(new DeleteMyThoughtCommand(currentUserId));
        return Ok(new { success = true, message = "Thought deleted successfully." });
    }

    [Authorize]
    [HttpPost("/api/thoughts")]
    public async Task<IActionResult> CreateThought([FromBody] CreateThoughtRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Quote))
        {
            return BadRequest(new { message = "Quote cannot be empty." });
        }

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized();
        }

        var targetUserId = request.UserId ?? currentUserId;
        if (targetUserId != currentUserId && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var result = await Mediator.Send(new CreateBatchThoughtCommand(targetUserId, request.Quote));
        return Ok(result);
    }
}
