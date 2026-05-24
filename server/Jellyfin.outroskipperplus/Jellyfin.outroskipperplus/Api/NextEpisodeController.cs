using Jellyfin.Data.Enums;
using Jellyfin.Database.Implementations.Enums;
using MediaBrowser.Controller.Chapters;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Querying;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.outroskipperplus.Api;

[ApiController]
[Route("OutroSkipperPlus")]
public class NextEpisodeController : ControllerBase
{
    private readonly ILibraryManager _libraryManager;
    private readonly IChapterManager _chapterManager;

    public NextEpisodeController(
        ILibraryManager libraryManager,
        IChapterManager chapterManager)
    {
        _libraryManager = libraryManager;
        _chapterManager = chapterManager;
    }

    [HttpGet("NextEpisodeInfo")]
    public ActionResult GetNextEpisodeInfo([FromQuery] Guid itemId, [FromQuery] Guid userId)
    {
        var item = _libraryManager.GetItemById(itemId);
        if (item is not Episode currentEpisode)
            return NotFound("Item is not an episode.");

        var chapters = _chapterManager.GetChapters(item.Id);
        var outroChapter = chapters.FirstOrDefault(c =>
            c.Name != null &&
            c.Name.Contains("outro", StringComparison.OrdinalIgnoreCase));

        var season = _libraryManager.GetItemById(currentEpisode.ParentId);
        if (season == null)
            return NotFound("Season not found.");

        var episodes = _libraryManager.GetItemList(new InternalItemsQuery
        {
            ParentId = season.Id,
            IncludeItemTypes = new[] { BaseItemKind.Episode },
            OrderBy = new[] { (ItemSortBy.IndexNumber, SortOrder.Ascending) }
        }).ToList();

        var currentIndex = episodes.FindIndex(e => e.Id == currentEpisode.Id);
        if (currentIndex < 0 || currentIndex >= episodes.Count - 1)
            return NotFound("No next episode found.");

        var nextEpisode = episodes[currentIndex + 1] as Episode;
        if (nextEpisode == null)
            return NotFound("No next episode found.");

        return Ok(new
        {
            OutroStartTicks = outroChapter?.StartPositionTicks,
            NextEpisodeId = nextEpisode.Id,
            NextEpisodeName = nextEpisode.Name,
            NextEpisodeIndex = nextEpisode.IndexNumber
        });
    }

    [HttpGet("/OutroSkipperPlus/ClientScript")]
    public IActionResult GetClientScript()
    {
        var scriptPath = Path.Combine(
            Path.GetDirectoryName(GetType().Assembly.Location)!,
            "web",
            "outroskipperplus.js"
        );

        if (!System.IO.File.Exists(scriptPath))
            return NotFound("Client script not found.");

        var script = System.IO.File.ReadAllText(scriptPath);
        return Content(script, "application/javascript");
    }
}