using GstuPortal.Application.Features.Representatives.Queries.GetClassRepresentatives;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GstuPortal.WebApi.Controllers;

[AllowAnonymous]
public class RepresentativesController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetRepresentatives()
    {
        var result = await Mediator.Send(new GetClassRepresentativesQuery());
        return Ok(result);
    }
}
