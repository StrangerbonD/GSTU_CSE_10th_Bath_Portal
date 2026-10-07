using GstuPortal.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Thoughts.Commands.DeleteMyThought;

public record DeleteMyThoughtCommand(Guid UserId) : IRequest<bool>;

public class DeleteMyThoughtCommandHandler : IRequestHandler<DeleteMyThoughtCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteMyThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteMyThoughtCommand request, CancellationToken cancellationToken)
    {
        var thought = await _context.BatchThoughts
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (thought != null)
        {
            _context.BatchThoughts.Remove(thought);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
