using GstuPortal.Application.Common.Interfaces;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Thoughts;

public record DisallowThoughtCommand(Guid Id) : IRequest<bool>;

public class DisallowThoughtCommandHandler : IRequestHandler<DisallowThoughtCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DisallowThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DisallowThoughtCommand request, CancellationToken cancellationToken)
    {
        var thought = await _context.BatchThoughts.FindAsync(new object[] { request.Id }, cancellationToken);
        if (thought == null) throw new KeyNotFoundException("Thought not found.");

        thought.UpdateApproval(false);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
