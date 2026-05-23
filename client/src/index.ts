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
    `;

    overlay.innerHTML = `
        <div style="font-size:14px;">Up next: <strong>${info.nextEpisodeName}</strong></div>
        <button id="osp-skip-btn" style="padding:8px;cursor:pointer;background:#00a4dc;border:none;color:white;border-radius:4px;">
            Skip Outro →
        </button>
        <button id="osp-preview-btn" style="padding:8px;cursor:pointer;background:#444;border:none;color:white;border-radius:4px;">
            ▶ Preview Next Episode
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