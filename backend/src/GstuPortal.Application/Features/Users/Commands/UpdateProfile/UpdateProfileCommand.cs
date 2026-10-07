using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Users.Commands.UpdateProfile;

public record UpdateProfileCommand(
    Guid UserId,
    string FullName,
    string? AvatarUrl = null,
    string? CurrentPassword = null,
    string? NewPassword = null) : IRequest<UserDto>;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UserDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public UpdateProfileCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        GstuPortal.Application.Common.Validation.InputRules.ValidateFullName(request.FullName);

        user.UpdateProfile(request.FullName, request.AvatarUrl);

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                !_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                throw new InvalidOperationException("Current password is incorrect. Please re-check your password.");
            }

            GstuPortal.Application.Common.Validation.InputRules.ValidatePassword(request.NewPassword);

            var hash = _passwordHasher.HashPassword(request.NewPassword);
            user.ChangePassword(hash);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
