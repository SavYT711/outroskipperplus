const PLUGIN_BASE_URL = "/OutroSkipperPlus";

interface NextEpisodeInfo {
    OutroStartTicks: number | null;
    NextEpisodeId: string;
    NextEpisodeName: string;
    NextEpisodeIndex: number;
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
    <div style="font-size:14px;">Up next: <strong>${info.NextEpisodeName}</strong></div>
    <button id="osp-skip-btn" ...>Skip Outro →</button>
    <button id="osp-preview-btn" ...>▶ Preview Next Episode</button>
`;

    return overlay;
}

function removeOverlay() {
    document.getElementById("osp-overlay")?.remove();
    document.getElementById("osp-preview-player")?.remove();
}

export { fetchNextEpisodeInfo, createOverlay, removeOverlay };
export type { NextEpisodeInfo };