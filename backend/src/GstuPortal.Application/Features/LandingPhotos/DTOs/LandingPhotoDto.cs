namespace GstuPortal.Application.Features.LandingPhotos.DTOs;

public record LandingPhotoDto(
    Guid Id,
    string ImageUrl,
    string Title,
    string Subtitle,
    string BadgeText,
    int DisplayOrder,
    bool IsActive,
    DateTime CreatedAt
);
