using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Users.Commands.SubmitCrThought;

public record SubmitCrThoughtCommand(
    Guid UserId,
    string Tenure,
    string Thought) : IRequest<UserDto>;

public class SubmitCrThoughtCommandHandler : IRequestHandler<SubmitCrThoughtCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public SubmitCrThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(SubmitCrThoughtCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (!user.IsCr)
        {
            throw new InvalidOperationException("User is not an approved Class Representative.");
        }

        user.SubmitCrThought(request.Tenure, request.Thought);
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
