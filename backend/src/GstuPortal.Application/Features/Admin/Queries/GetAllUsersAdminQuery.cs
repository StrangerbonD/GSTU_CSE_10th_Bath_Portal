using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Application.Features.Auth.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Application.Features.Admin.Queries;

public record GetAllUsersAdminQuery() : IRequest<List<UserDto>>;

public class GetAllUsersAdminQueryHandler : IRequestHandler<GetAllUsersAdminQuery, List<UserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllUsersAdminQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserDto>> Handle(GetAllUsersAdminQuery request, CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(cancellationToken);

        return users.Select(u => u.ToDto()).ToList();
    }
}
