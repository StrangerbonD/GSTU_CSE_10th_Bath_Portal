using GstuPortal.Application.Features.Statistics.DTOs;
using GstuPortal.Application.Features.Statistics.Queries.GetBatchStatistics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace GstuPortal.WebApi.Controllers;

[AllowAnonymous]
public class StatisticsController : BaseApiController
{
    private readonly IMemoryCache _cache;
    public const string CacheKey = "BatchStatistics_Public_Cache";

    public StatisticsController(IMemoryCache cache)
    {
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetStatistics()
    {
        Response.Headers.CacheControl = "public, max-age=120, stale-while-revalidate=600";

        if (!_cache.TryGetValue(CacheKey, out BatchStatisticsDto? statistics) || statistics == null)
        {
            statistics = await Mediator.Send(new GetBatchStatisticsQuery());
            _cache.Set(CacheKey, statistics, TimeSpan.FromMinutes(10));
        }

        return Ok(statistics);
    }
}
