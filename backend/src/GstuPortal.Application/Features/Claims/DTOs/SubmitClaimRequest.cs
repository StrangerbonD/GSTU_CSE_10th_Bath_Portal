namespace GstuPortal.Application.Features.Claims.DTOs;

public record SubmitClaimRequest(Guid UserId, string StudentId, string RecognitionNote);
