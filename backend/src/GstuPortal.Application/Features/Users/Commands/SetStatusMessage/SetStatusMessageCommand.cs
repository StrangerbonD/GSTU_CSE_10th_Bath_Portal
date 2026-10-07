using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Users.Commands.SetStatusMessage;

public record SetStatusMessageCommand(Guid UserId, string StatusMessage) : IRequest<UserDto>;

public class SetStatusMessageCommandHandler : IRequestHandler<SetStatusMessageCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public SetStatusMessageCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(SetStatusMessageCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.SetStatusMessage(request.StatusMessage);
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
