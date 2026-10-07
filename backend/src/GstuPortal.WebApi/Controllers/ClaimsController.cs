using System.Security.Claims;
using GstuPortal.Application.Features.Claims.Commands.ApproveClaim;
using GstuPortal.Application.Features.Claims.Commands.ApproveCrClaim;
using GstuPortal.Application.Features.Claims.Commands.SubmitClaim;
using GstuPortal.Application.Features.Claims.Commands.SubmitCrClaim;
using GstuPortal.Application.Features.Claims.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GstuPortal.WebApi.Controllers;

public class ClaimsController : BaseApiController
{
    [HttpPost]
    public async Task<IActionResult> SubmitClaim([FromBody] SubmitClaimRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userIdStr, out var currentUserId) || (currentUserId != request.UserId && !User.IsInRole("Admin")))
        {
            return Forbid();
        }

        var result = await Mediator.Send(new SubmitClaimCommand(request.UserId, request.StudentId, request.RecognitionNote));
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{userId:guid}/approve")]
    public async Task<IActionResult> ApproveClaim(Guid userId)
    {
        var result = await Mediator.Send(new ApproveClaimCommand(userId));
        return Ok(result);
    }

    [HttpPost("cr")]
    public async Task<IActionResult> SubmitCrClaim([FromBody] SubmitCrClaimRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userIdStr, out var currentUserId) || (currentUserId != request.UserId && !User.IsInRole("Admin")))
        {
            return Forbid();
        }

        var result = await Mediator.Send(new SubmitCrClaimCommand(request.UserId, request.Note));
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("cr/{userId:guid}/approve")]
    public async Task<IActionResult> ApproveCrClaim(Guid userId)
    {
        var result = await Mediator.Send(new ApproveCrClaimCommand(userId));
        return Ok(result);
    }
}
