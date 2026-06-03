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

function removeOverlay() {
    document.getElementById("osp-overlay")?.remove();
    document.getElementById("osp-preview-player")?.remove();
}

export { fetchNextEpisodeInfo, createOverlay, removeOverlay };
export type { NextEpisodeInfo };