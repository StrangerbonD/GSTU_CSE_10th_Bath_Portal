using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.LandingPhotos.DTOs;
using GstuPortal.Domain.Entities;
using MediatR;

namespace GstuPortal.Application.Features.LandingPhotos.Commands;

public record CreateLandingPhotoCommand(CreateLandingPhotoDto Dto) : IRequest<LandingPhotoDto>;

public class CreateLandingPhotoCommandHandler : IRequestHandler<CreateLandingPhotoCommand, LandingPhotoDto>
{
    private readonly IApplicationDbContext _context;

    public CreateLandingPhotoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LandingPhotoDto> Handle(CreateLandingPhotoCommand request, CancellationToken cancellationToken)
    {
        var photo = new LandingPhoto(
            request.Dto.ImageUrl,
            request.Dto.Title ?? "GSTU CSE 10th Batch Family",
            request.Dto.Subtitle ?? "Department of Computer Science & Engineering",
            request.Dto.BadgeText ?? "Memories Forever",
            request.Dto.DisplayOrder,
            request.Dto.IsActive
        );

        _context.LandingPhotos.Add(photo);
        await _context.SaveChangesAsync(cancellationToken);

        return new LandingPhotoDto(
            photo.Id,
            photo.ImageUrl,
            photo.Title,
            photo.Subtitle,
            photo.BadgeText,
            photo.DisplayOrder,
            photo.IsActive,
            photo.CreatedAt
        );
    }
}
