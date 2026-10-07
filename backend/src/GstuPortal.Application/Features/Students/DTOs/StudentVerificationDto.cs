namespace GstuPortal.Application.Features.Students.DTOs;

public record StudentVerificationDto(
    bool Verified,
    string StudentId,
    string StudentName,
    string Session,
    string Department,
    string Degree,
    double Cgpa,
    int TotalCredits,
    bool IsDistinction,
    DateTime IssuedAt);
