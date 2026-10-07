using GstuPortal.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.LandingPhotos.Commands;

public record DeleteLandingPhotoCommand(Guid Id) : IRequest<bool>;

public class DeleteLandingPhotoCommandHandler : IRequestHandler<DeleteLandingPhotoCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteLandingPhotoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteLandingPhotoCommand request, CancellationToken cancellationToken)
    {
        var photo = await _context.LandingPhotos
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (photo == null) return false;

        _context.LandingPhotos.Remove(photo);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
