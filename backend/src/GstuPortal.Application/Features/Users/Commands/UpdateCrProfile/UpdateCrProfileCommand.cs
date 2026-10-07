using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Users.Commands.UpdateCrProfile;

public record UpdateCrProfileCommand(
    Guid UserId,
    string Tenure,
    string Thought) : IRequest<UserDto>;

public class UpdateCrProfileCommandHandler : IRequestHandler<UpdateCrProfileCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateCrProfileCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(UpdateCrProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.UpdateCrProfile(request.Tenure, request.Thought);
        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
