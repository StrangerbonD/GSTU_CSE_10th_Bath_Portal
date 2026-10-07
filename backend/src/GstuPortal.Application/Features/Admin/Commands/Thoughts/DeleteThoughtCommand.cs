using GstuPortal.Application.Common.Interfaces;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Thoughts;

public record DeleteThoughtCommand(Guid Id) : IRequest<bool>;

public class DeleteThoughtCommandHandler : IRequestHandler<DeleteThoughtCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteThoughtCommand request, CancellationToken cancellationToken)
    {
        var thought = await _context.BatchThoughts.FindAsync(new object[] { request.Id }, cancellationToken);
        if (thought == null) throw new KeyNotFoundException("Thought not found.");

        _context.BatchThoughts.Remove(thought);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
