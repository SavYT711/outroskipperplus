using System.Text;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging;

namespace Jellyfin.outroskipperplus;

public class ScriptInjector
{
    private readonly IApplicationPaths _applicationPaths;
    private readonly ILogger _logger;

    public ScriptInjector(IApplicationPaths applicationPaths, ILogger logger)
    {
        _applicationPaths = applicationPaths;
        _logger = logger;
    }

    public ScriptInjector(IApplicationPaths applicationPaths, ILogger<ScriptInjector> logger)
    {
        _applicationPaths = applicationPaths;
        _logger = logger;
    }

    public void InjectScript()
    {
        try
        {
            // Try common Jellyfin web paths
            var possiblePaths = new[]
            {
                Path.Combine(_applicationPaths.WebPath, "index.html"),
                @"C:\Program Files\Jellyfin\Server\jellyfin-web\index.html"
            };

            var indexPath = possiblePaths.FirstOrDefault(File.Exists);

            if (indexPath == null)
            {
                _logger.LogWarning("index.html not found in any known location.");
                return;
            }

            var content = File.ReadAllText(indexPath);
            var scriptTag = "<script src=\"/OutroSkipperPlus/ClientScript\"></script>";

            if (content.Contains(scriptTag))
            {
                _logger.LogInformation("Script already injected.");
                return;
            }

            content = content.Replace("</body>", $"{scriptTag}</body>");
            File.WriteAllText(indexPath, content, Encoding.UTF8);
            _logger.LogInformation("OutroSkipperPlus script injected at {Path}.", indexPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to inject script.");
        }
    }
}    