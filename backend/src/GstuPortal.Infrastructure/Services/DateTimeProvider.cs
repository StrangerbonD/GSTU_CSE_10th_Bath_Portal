using GstuPortal.Application.Common.Interfaces;

namespace GstuPortal.Infrastructure.Services;

public class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
