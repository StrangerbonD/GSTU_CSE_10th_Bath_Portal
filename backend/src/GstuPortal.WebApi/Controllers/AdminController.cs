using GstuPortal.Application.Features.Admin.Commands.Claims;
using GstuPortal.Application.Features.Admin.Commands.EditCourseGrade;
using GstuPortal.Application.Features.Admin.Commands.Thoughts;
using GstuPortal.Application.Features.Admin.Commands.Users;
using GstuPortal.Application.Features.Admin.DTOs;
using GstuPortal.Application.Features.Admin.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GstuPortal.WebApi.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController : BaseApiController
{
    private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;

    public AdminController(Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
    {
        _cache = cache;
    }

    // 1. Overview Statistics
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await Mediator.Send(new GetAdminStatsQuery());
        return Ok(stats);
    }

    // 2. Student Leaderboard (33 Students with live CGPA & Credits)
    [HttpGet("students")]
    public async Task<IActionResult> GetAllStudents()
    {
        var students = await Mediator.Send(new GetAllStudentsAdminQuery());
        return Ok(students);
    }

    // 3. Edit Student Course Result & Recalculate CGPA
    [HttpPut("students/{studentId}/course-grade")]
    public async Task<IActionResult> EditCourseGrade(string studentId, [FromBody] EditCourseGradeDto dto)
    {
        var result = await Mediator.Send(new EditCourseGradeCommand(studentId, dto));
        _cache.Remove(StatisticsController.CacheKey);
        return Ok(new { success = result, message = $"Grade for course {dto.CourseCode} updated successfully." });
    }

    // 4. User Directory
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await Mediator.Send(new GetAllUsersAdminQuery());
        return Ok(users);
    }

    // 5. Toggle User Active Status (Enable / Disable)
    [HttpPut("users/{userId:guid}/toggle-status")]
    public async Task<IActionResult> ToggleUserStatus(Guid userId)
    {
        var updated = await Mediator.Send(new ToggleUserStatusCommand(userId));
        return Ok(updated);
    }

    // 6. User Role Management
    [HttpPut("users/{userId:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid userId, [FromBody] UpdateRoleRequest request)
    {
        var updated = await Mediator.Send(new UpdateUserRoleCommand(userId, request.Role));
        return Ok(updated);
    }

    // 7. Delete User
    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        await Mediator.Send(new DeleteUserCommand(userId));
        return Ok(new { success = true, message = "User deleted successfully." });
    }

    // 8. Batch Identity Claims Moderation
    [HttpPut("claims/{userId:guid}/approve")]
    public async Task<IActionResult> ApproveBatchClaim(Guid userId)
    {
        var user = await Mediator.Send(new ApproveBatchClaimCommand(userId));
        return Ok(user);
    }

    [HttpPut("claims/{userId:guid}/reject")]
    public async Task<IActionResult> RejectBatchClaim(Guid userId)
    {
        var user = await Mediator.Send(new RejectBatchClaimCommand(userId));
        return Ok(user);
    }

    // 9. Class Representative Claims Moderation
    [HttpPut("claims/cr/{userId:guid}/approve")]
    public async Task<IActionResult> ApproveCrClaim(Guid userId)
    {
        var user = await Mediator.Send(new ApproveCrClaimCommand(userId));
        return Ok(user);
    }

    [HttpPut("claims/cr/{userId:guid}/reject")]
    public async Task<IActionResult> RejectCrClaim(Guid userId)
    {
        var user = await Mediator.Send(new RejectCrClaimCommand(userId));
        return Ok(user);
    }

    // 10. Home Page Thoughts Moderation
    [HttpGet("thoughts")]
    public async Task<IActionResult> GetAllThoughts()
    {
        var thoughts = await Mediator.Send(new GetAllThoughtsAdminQuery());
        return Ok(thoughts);
    }

    [HttpPut("thoughts/{id:guid}/approve")]
    public async Task<IActionResult> ApproveThought(Guid id)
    {
        await Mediator.Send(new ApproveThoughtCommand(id));
        return Ok(new { success = true, message = "Thought allowed successfully." });
    }

    [HttpPut("thoughts/{id:guid}/disallow")]
    public async Task<IActionResult> DisallowThought(Guid id)
    {
        await Mediator.Send(new DisallowThoughtCommand(id));
        return Ok(new { success = true, message = "Thought disallowed successfully." });
    }

    [HttpDelete("thoughts/{id:guid}")]
    public async Task<IActionResult> DeleteThought(Guid id)
    {
        await Mediator.Send(new DeleteThoughtCommand(id));
        return Ok(new { success = true, message = "Thought deleted successfully." });
    }

    // 11. CR Thought / Story Moderation
    [HttpPut("cr-thoughts/{userId:guid}/approve")]
    public async Task<IActionResult> ApproveCrThought(Guid userId)
    {
        var user = await Mediator.Send(new ApproveCrThoughtCommand(userId));
        return Ok(user);
    }

    [HttpPut("cr-thoughts/{userId:guid}/reject")]
    public async Task<IActionResult> RejectCrThought(Guid userId)
    {
        var user = await Mediator.Send(new RejectCrThoughtCommand(userId));
        return Ok(user);
    }
}
