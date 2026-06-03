using MediaBrowser.Model.Plugins;

namespace Jellyfin.outroskipperplus.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    public bool IsEnabled { get; set; } = true;
    public int CountdownSeconds { get; set; } = 30;
    public bool AutoAdvance { get; set; } = false;
    public bool PipSwapMode { get; set; } = false;
    public string PreviewSize { get; set; } = "medium";
}