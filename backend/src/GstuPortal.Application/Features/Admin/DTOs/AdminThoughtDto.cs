namespace GstuPortal.Application.Features.Admin.DTOs;

public record AdminThoughtDto(
    Guid Id,
    Guid? UserId,
    string AuthorName,
    string RoleTitle,
    string Quote,
    string? AvatarUrl,
    bool IsApproved,
    DateTime CreatedAt
);
