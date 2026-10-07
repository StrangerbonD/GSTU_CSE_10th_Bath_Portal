using System.Security.Claims;
using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Students.Queries.GetTranscript;
using GstuPortal.Application.Features.Students.Queries.VerifyStudent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.WebApi.Controllers;

public class StudentsController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public StudentsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{studentId}/transcript")]
    public async Task<IActionResult> GetTranscript(string studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new { message = "Student ID is required." });
        }

        var targetStudentId = studentId.Trim();

        // Admin can view any student's transcript
        if (!User.IsInRole("Admin"))
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
            if (!Guid.TryParse(userIdStr, out var currentUserId))
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            var me = await _context.Users.AsNoTracking()
                .Where(u => u.Id == currentUserId)
                .Select(u => new { u.StudentId, u.IsVerifiedBatchStudent })
                .FirstOrDefaultAsync();

            if (me is null || !me.IsVerifiedBatchStudent || string.IsNullOrWhiteSpace(me.StudentId) ||
                !string.Equals(me.StudentId.Trim(), targetStudentId, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Access denied. You can only view your own verified academic transcript."
                });
            }
        }

        var transcript = await Mediator.Send(new GetTranscriptQuery(targetStudentId));
        return Ok(transcript);
    }

    [HttpGet("{studentId}/certificate")]
    public async Task<IActionResult> GetCertificate(string studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new { message = "Student ID is required." });
        }

        var targetStudentId = studentId.Trim();

        // Admin can view any student's certificate; regular students can only view their own
        if (!User.IsInRole("Admin"))
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
            if (!Guid.TryParse(userIdStr, out var currentUserId))
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            var me = await _context.Users.AsNoTracking()
                .Where(u => u.Id == currentUserId)
                .Select(u => new { u.StudentId, u.IsVerifiedBatchStudent })
                .FirstOrDefaultAsync();

            if (me is null || !me.IsVerifiedBatchStudent || string.IsNullOrWhiteSpace(me.StudentId) ||
                !string.Equals(me.StudentId.Trim(), targetStudentId, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Access denied. You can only view your own verified academic certificate."
                });
            }
        }

        var certificate = await Mediator.Send(new VerifyStudentQuery(targetStudentId));
        return Ok(certificate);
    }

    [AllowAnonymous]
    [HttpGet("verify/{studentId}")]
    public async Task<IActionResult> VerifyStudent(string studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return BadRequest(new { message = "Student ID is required." });
        }

        var targetStudentId = studentId.Trim();
        var verification = await Mediator.Send(new VerifyStudentQuery(targetStudentId));

        // Privacy & Ownership Check:
        // Only Admin or the owner student can view sensitive academic standing (CGPA).
        // Public unauthenticated / third-party callers receive minimal verification without private grades.
        bool isAuthorized = false;
        if (User.Identity?.IsAuthenticated == true)
        {
            if (User.IsInRole("Admin"))
            {
                isAuthorized = true;
            }
            else
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
                if (Guid.TryParse(userIdStr, out var currentUserId))
                {
                    var me = await _context.Users.AsNoTracking()
                        .Where(u => u.Id == currentUserId)
                        .Select(u => new { u.StudentId, u.IsVerifiedBatchStudent })
                        .FirstOrDefaultAsync();

                    if (me != null && me.IsVerifiedBatchStudent &&
                        string.Equals(me.StudentId?.Trim(), targetStudentId, StringComparison.OrdinalIgnoreCase))
                    {
                        isAuthorized = true;
                    }
                }
            }
        }

        if (!isAuthorized)
        {
            return Ok(verification with
            {
                Cgpa = 0.0,
                TotalCredits = 0,
                IsDistinction = false
            });
        }

        return Ok(verification);
    }
}
