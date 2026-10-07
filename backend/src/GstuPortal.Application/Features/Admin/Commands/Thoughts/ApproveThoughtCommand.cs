using GstuPortal.Application.Common.Interfaces;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Thoughts;

public record ApproveThoughtCommand(Guid Id) : IRequest<bool>;

public class ApproveThoughtCommandHandler : IRequestHandler<ApproveThoughtCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ApproveThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ApproveThoughtCommand request, CancellationToken cancellationToken)
    {
        var thought = await _context.BatchThoughts.FindAsync(new object[] { request.Id }, cancellationToken);
        if (thought == null) throw new KeyNotFoundException("Thought not found.");

        thought.UpdateApproval(true);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
