using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;

namespace GstuPortal.Application.Features.Admin.Commands.Claims;

public record ApproveCrThoughtCommand(Guid UserId) : IRequest<UserDto>;

public class ApproveCrThoughtCommandHandler : IRequestHandler<ApproveCrThoughtCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public ApproveCrThoughtCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(ApproveCrThoughtCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.ApproveCrThought();
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
