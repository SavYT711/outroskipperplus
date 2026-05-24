using Jellyfin.outroskipperplus;
using Jellyfin.Plugin.OutroSkipperPlus.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.OutroSkipperPlus;

public class Plugin : BasePlugin<PluginConfiguration>
{
    public override string Name => "Outro Skipper Plus";
    public override Guid Id => Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    public override string Description => "Skips outros and previews the next episode.";

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    public static Plugin? Instance { get; private set; }
    
    public Plugin(
        IApplicationPaths applicationPaths,
        IXmlSerializer xmlSerializer,
        ILogger<Plugin> logger)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
        var injector = new ScriptInjector(applicationPaths, logger);
        injector.InjectScript();
    }
    
}