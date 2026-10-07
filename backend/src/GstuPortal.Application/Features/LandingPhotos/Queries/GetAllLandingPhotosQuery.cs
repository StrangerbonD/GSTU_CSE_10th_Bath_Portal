using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.LandingPhotos.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.LandingPhotos.Queries;

public record GetAllLandingPhotosQuery : IRequest<List<LandingPhotoDto>>;

public class GetAllLandingPhotosQueryHandler : IRequestHandler<GetAllLandingPhotosQuery, List<LandingPhotoDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllLandingPhotosQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LandingPhotoDto>> Handle(GetAllLandingPhotosQuery request, CancellationToken cancellationToken)
    {
        var photos = await _context.LandingPhotos
            .AsNoTracking()
            .OrderBy(p => p.DisplayOrder)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

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
