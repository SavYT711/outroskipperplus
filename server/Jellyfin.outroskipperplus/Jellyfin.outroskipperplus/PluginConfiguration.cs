using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.OutroSkipperPlus.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    public bool EnableOutroSkip { get; set; } = true;
    public bool EnableNextEpisodePreview { get; set; } = true;
    public int CountdownSeconds { get; set; } = 30;
}