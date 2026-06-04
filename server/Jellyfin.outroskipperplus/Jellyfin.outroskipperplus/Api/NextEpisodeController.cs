using Jellyfin.outroskipperplus;
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
    private readonly IUserManager _userManager;

    public NextEpisodeController(
        ILibraryManager libraryManager,
        IChapterManager chapterManager,
        IUserManager userManager)
    {
        _libraryManager = libraryManager;
        _chapterManager = chapterManager;
        _userManager = userManager;
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
            outroStartTicks = outroChapter?.StartPositionTicks,
            nextEpisodeId = nextEpisode.Id,
            nextEpisodeName = nextEpisode.Name,
            nextEpisodeIndex = nextEpisode.IndexNumber
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
    
    [HttpGet("Configuration")]
    public ActionResult GetConfiguration()
    {
        var config = Plugin.Instance?.Configuration;
        if (config == null)
            return NotFound("Configuration not found.");

        return Ok(new
        {
            isEnabled = config.IsEnabled,
            countdownSeconds = config.CountdownSeconds,
            autoAdvance = config.AutoAdvance,
            pipSwapMode = config.PipSwapMode,
            previewSize = config.PreviewSize
        });
    }
    
    [HttpGet("RandomUnwatched")]
    public ActionResult GetRandomUnwatched([FromQuery] Guid userId)
    {
        var user = _userManager.GetUserById(userId);
        if (user == null)
            return NotFound("User not found.");

        var items = _libraryManager.GetItemList(new InternalItemsQuery
        {
            IncludeItemTypes = new[] { BaseItemKind.Series, BaseItemKind.Movie },
            IsPlayed = false,
            User = user,
            Recursive = true,
            Limit = 50
        });

        if (items.Count == 0)
            return NotFound("No unwatched content found.");

        var random = new Random();
        var pick = items[random.Next(items.Count)];

        return Ok(new
        {
            itemId = pick.Id,
            itemName = pick.Name,
            itemType = pick.GetType().Name,
            backdropUrl = $"/Items/{pick.Id}/Images/Backdrop?fillWidth=1920&quality=90",
            posterUrl = $"/Items/{pick.Id}/Images/Primary?fillWidth=400&quality=90"
        });
    }
}