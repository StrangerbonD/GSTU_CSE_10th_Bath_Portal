namespace GstuPortal.Application.Features.Representatives.DTOs;

public record ClassRepresentativeDto(
    Guid Id,
    string Name,
    string Tenure,
    string Role,
    string? Image,
    string? Thought);
