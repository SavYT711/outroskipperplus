using MediaBrowser.Controller.Chapters;
using MediaBrowser.Controller.Dto;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.TV;
using MediaBrowser.Model.Querying;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.outroskipperplus.Api;

[ApiController]
[Route("OutroSkipperPlus")]
public class NextEpisodeController : ControllerBase
{
    private readonly ILibraryManager _libraryManager;
    private readonly IChapterManager _chapterManager;
    private readonly ITVSeriesManager _tvSeriesManager;
    private readonly IUserManager _userManager;

    public NextEpisodeController(
        ILibraryManager libraryManager,
        IChapterManager chapterManager,
        ITVSeriesManager tvSeriesManager,
        IUserManager userManager)
    {
        _libraryManager = libraryManager;
        _chapterManager = chapterManager;
        _tvSeriesManager = tvSeriesManager;
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

        var user = _userManager.GetUserById(userId);
        if (user == null)
            return NotFound("User not found.");

        var nextUpResult = _tvSeriesManager.GetNextUp(new NextUpQuery
        {
            SeriesId = currentEpisode.SeriesId,
            StartIndex = currentEpisode.IndexNumber,
            User = user
        }, new DtoOptions());

        var nextEpisode = nextUpResult.Items.FirstOrDefault() as Episode;
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
}