using GstuPortal.Application.Features.LandingPhotos.Commands;
using GstuPortal.Application.Features.LandingPhotos.DTOs;
using GstuPortal.Application.Features.LandingPhotos.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GstuPortal.WebApi.Controllers;

[ApiController]
public class LandingPhotosController : BaseApiController
{
    // Public: Get all active photos for the landing page carousel
    [AllowAnonymous]
    [HttpGet("/api/landing-photos")]
    public async Task<IActionResult> GetActiveLandingPhotos()
    {
        var photos = await Mediator.Send(new GetActiveLandingPhotosQuery());
        return Ok(photos);
    }

    // Admin: Get all photos (both active and inactive)
    [Authorize(Roles = "Admin")]
    [HttpGet("/api/admin/landing-photos")]
    public async Task<IActionResult> GetAllLandingPhotos()
    {
        var photos = await Mediator.Send(new GetAllLandingPhotosQuery());
        return Ok(photos);
    }

    // Admin: Create photo
    [Authorize(Roles = "Admin")]
    [HttpPost("/api/admin/landing-photos")]
    public async Task<IActionResult> CreateLandingPhoto([FromBody] CreateLandingPhotoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            return BadRequest(new { message = "Image URL is required." });
        }

        var created = await Mediator.Send(new CreateLandingPhotoCommand(dto));
        return Ok(created);
    }

    // Admin: Update photo
    [Authorize(Roles = "Admin")]
    [HttpPut("/api/admin/landing-photos/{id:guid}")]
    public async Task<IActionResult> UpdateLandingPhoto(Guid id, [FromBody] UpdateLandingPhotoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            return BadRequest(new { message = "Image URL is required." });
        }

        var updated = await Mediator.Send(new UpdateLandingPhotoCommand(id, dto));
        if (updated == null)
        {
            return NotFound(new { message = "Photo not found." });
        }

        return Ok(updated);
    }

    // Admin: Delete photo
    [Authorize(Roles = "Admin")]
    [HttpDelete("/api/admin/landing-photos/{id:guid}")]
    public async Task<IActionResult> DeleteLandingPhoto(Guid id)
    {
        var deleted = await Mediator.Send(new DeleteLandingPhotoCommand(id));
        if (!deleted)
        {
            return NotFound(new { message = "Photo not found." });
        }

        return Ok(new { success = true, message = "Photo deleted successfully." });
    }
}
