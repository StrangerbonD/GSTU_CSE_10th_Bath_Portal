using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.LandingPhotos.DTOs;
using GstuPortal.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.LandingPhotos.Queries;

public record GetActiveLandingPhotosQuery : IRequest<List<LandingPhotoDto>>;

public class GetActiveLandingPhotosQueryHandler : IRequestHandler<GetActiveLandingPhotosQuery, List<LandingPhotoDto>>
{
    private readonly IApplicationDbContext _context;

    public GetActiveLandingPhotosQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LandingPhotoDto>> Handle(GetActiveLandingPhotosQuery request, CancellationToken cancellationToken)
    {
        var photos = await _context.LandingPhotos
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        if (!photos.Any())
        {
            // Seed default photo if empty
            var defaultPhoto = new LandingPhoto(
                "/images/landing/group-photo.jpg",
                "GSTU CSE 10th Batch Family",
                "Department of Computer Science & Engineering",
                "Memories Forever",
                1,
                true
            );
            _context.LandingPhotos.Add(defaultPhoto);
            await _context.SaveChangesAsync(cancellationToken);

            return new List<LandingPhotoDto>
            {
                new LandingPhotoDto(
                    defaultPhoto.Id,
                    defaultPhoto.ImageUrl,
                    defaultPhoto.Title,
                    defaultPhoto.Subtitle,
                    defaultPhoto.BadgeText,
                    defaultPhoto.DisplayOrder,
                    defaultPhoto.IsActive,
                    defaultPhoto.CreatedAt
                )
            };
        }

        return photos.Select(p => new LandingPhotoDto(
            p.Id,
            p.ImageUrl,
            p.Title,
            p.Subtitle,
            p.BadgeText,
            p.DisplayOrder,
            p.IsActive,
            p.CreatedAt
        )).ToList();
    }
}
