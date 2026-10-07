using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.LandingPhotos.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.LandingPhotos.Commands;

public record UpdateLandingPhotoCommand(Guid Id, UpdateLandingPhotoDto Dto) : IRequest<LandingPhotoDto?>;

public class UpdateLandingPhotoCommandHandler : IRequestHandler<UpdateLandingPhotoCommand, LandingPhotoDto?>
{
    private readonly IApplicationDbContext _context;

    public UpdateLandingPhotoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LandingPhotoDto?> Handle(UpdateLandingPhotoCommand request, CancellationToken cancellationToken)
    {
        var photo = await _context.LandingPhotos
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (photo == null) return null;

        photo.Update(
            request.Dto.ImageUrl,
            request.Dto.Title ?? "GSTU CSE 10th Batch Family",
            request.Dto.Subtitle ?? "Department of Computer Science & Engineering",
            request.Dto.BadgeText ?? "Memories Forever",
            request.Dto.DisplayOrder,
            request.Dto.IsActive
        );

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
