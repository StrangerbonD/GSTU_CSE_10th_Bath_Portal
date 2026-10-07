namespace GstuPortal.Application.Features.LandingPhotos.DTOs;

public record UpdateLandingPhotoDto(
    string ImageUrl,
    string? Title,
    string? Subtitle,
    string? BadgeText,
    int DisplayOrder,
    bool IsActive
);
