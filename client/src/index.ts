const PLUGIN_BASE_URL = "/OutroSkipperPlus";

interface NextEpisodeInfo {
    outroStartTicks: number | null;
    nextEpisodeId: string;
    nextEpisodeName: string;
    nextEpisodeIndex: number;
}

async function fetchNextEpisodeInfo(itemId: string, userId: string): Promise<NextEpisodeInfo | null> {
    const response = await fetch(`${PLUGIN_BASE_URL}/NextEpisodeInfo?itemId=${itemId}&userId=${userId}`);
    if (!response.ok) return null;
    return await response.json();
}

function createOverlay(info: NextEpisodeInfo): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.id = "osp-overlay";
    overlay.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 30px;
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 9999;
        font-family: sans-serif;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 220px;
        opacity: 0;
        transition: opacity 1s ease-in-out;
    `;

    overlay.innerHTML = `
        <div style="font-size:12px;color:#aaa;">Up next</div>
        <div style="font-size:15px;font-weight:bold;">${info.nextEpisodeName}</div>
        <button id="osp-watch-btn" style="padding:8px;cursor:pointer;background:#00a4dc;border:none;color:white;border-radius:4px;font-size:14px;">
            ▶ Watch Now
        </button>
        <button id="osp-dismiss-btn" style="padding:6px;cursor:pointer;background:transparent;border:1px solid #666;color:#aaa;border-radius:4px;font-size:12px;">
            Dismiss
        </button>
    `;

    return overlay;
}

function createLastEpisodeOverlay(suggestion: any, seriesName: string): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.id = "osp-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.8s ease-in-out;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #000;
    `;

    const serverAddress = (window as any).ApiClient?.serverAddress?.() ?? '';

    overlay.innerHTML = `
        <div id="osp-backdrop" style="
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-image: url('${serverAddress}${suggestion.backdropUrl}');
            background-size: cover;
            background-position: center;
            filter: brightness(0.35);
            pointer-events: none;
        "></div>

        <div style="position: relative; z-index: 1; text-align: center; color: white; font-family: sans-serif; padding: 40px;">
            <div style="font-size: 18px; color: #aaa; margin-bottom: 8px;">${seriesName === 'Movie' ? "You've finished watching the movie!" : "You've finished the series!"}</div>            <div style="font-size: 16px; color: #aaa; margin-bottom: 16px;">You might also like</div>
            <div style="font-size: 48px; font-weight: 700; margin-bottom: 32px;">${suggestion.itemName}</div>
            <div style="display: flex; gap: 16px; justify-content: center;">
                <button id="osp-watch-btn" style="padding:14px 32px;cursor:pointer;background:#00a4dc;border:none;color:white;border-radius:6px;font-size:18px;font-weight:600;">
                    ▶ Watch Now
                </button>
                <button id="osp-dismiss-btn" style="padding:14px 32px;cursor:pointer;background:transparent;border:2px solid #666;color:#aaa;border-radius:6px;font-size:18px;">
                    Dismiss
                </button>
            </div>
        </div>
    `;

    return overlay;
}


function removeOverlay() {
    document.getElementById("osp-overlay")?.remove();
    document.getElementById("osp-preview-player")?.remove();
}

export { fetchNextEpisodeInfo, createOverlay, createLastEpisodeOverlay, removeOverlay };
export type { NextEpisodeInfo };