namespace GstuPortal.Application.Features.Thoughts.DTOs;

public record BatchThoughtDto(
    Guid Id,
    string Name,
    string? Role,
    string Quote,
    string? Image,
    string Time,
    bool IsVerifiedBatchStudent,
    DateTime CreatedAt,
    bool IsApproved = false);
