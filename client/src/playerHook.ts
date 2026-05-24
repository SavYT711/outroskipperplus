import { fetchNextEpisodeInfo, createOverlay, removeOverlay } from "./index";
import type { NextEpisodeInfo } from "./index";

const TICKS_PER_SECOND = 10_000_000;

let overlayShown = false;
let currentItemId: string | null = null;
let cachedInfo: NextEpisodeInfo | null = null;

// Intercept fetch to grab the item ID from PlaybackInfo requests
// Intercept XHR to grab the item ID from PlaybackInfo requests
(window as any)._ospItemId = null;

const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method: string, url: string) {
    const match = url.toString().match(/\/Items\/([a-f0-9]{32})\/PlaybackInfo/i);
    if (match) {
        (window as any)._ospItemId = match[1];
    }
    return originalOpen.apply(this, arguments as any);
};

function ticksToSeconds(ticks: number): number {
    return ticks / TICKS_PER_SECOND;
}

function getVideoElement(): HTMLVideoElement | null {
    return document.querySelector("video");
}

function getCurrentJellyfinContext(): { itemId: string; userId: string } | null {
    const apiClient = (window as any).ApiClient;
    if (!apiClient) return null;

    const userId = apiClient.getCurrentUserId?.();
    if (!userId || !(window as any)._ospItemId) return null;

    return { itemId: (window as any)._ospItemId, userId };

}

async function onTimeUpdate() {
    const video = getVideoElement();
    if (!video) return;

    const context = getCurrentJellyfinContext();
    if (!context) return;

    const { itemId, userId } = context;

    // Reset state if episode changed
    if (itemId !== currentItemId) {
        currentItemId = itemId;
        cachedInfo = null;
        overlayShown = false;
        removeOverlay();
        cachedInfo = await fetchNextEpisodeInfo(itemId, userId);
    }

    if (!cachedInfo || !cachedInfo.outroStartTicks) return;

    const outroStartSeconds = ticksToSeconds(cachedInfo.outroStartTicks);
    const currentTime = video.currentTime;

    // Show overlay when outro starts
    if (!overlayShown && currentTime >= outroStartSeconds) {
        overlayShown = true;
        const overlay = createOverlay(cachedInfo);
        document.body.appendChild(overlay);

        document.getElementById("osp-skip-btn")?.addEventListener("click", () => {
            video.currentTime = video.duration;
            removeOverlay();
        });

        document.getElementById("osp-preview-btn")?.addEventListener("click", () => {
            startPreview(cachedInfo!.nextEpisodeId);
        });
    }
}

function startPreview(nextEpisodeId: string) {
    const apiClient = (window as any).ApiClient;
    const token = apiClient?.accessToken?.();
    const serverAddress = apiClient?.serverAddress?.();
    if (!token || !serverAddress) return;

    const previewUrl = `${serverAddress}/Videos/${nextEpisodeId}/stream?api_key=${token}`;

    const previewPlayer = document.createElement("video");
    previewPlayer.id = "osp-preview-player";
    previewPlayer.src = previewUrl;
    previewPlayer.muted = true;
    previewPlayer.autoplay = true;
    previewPlayer.style.cssText = `
        position: fixed;
        bottom: 220px;
        right: 30px;
        width: 320px;
        border-radius: 8px;
        z-index: 9998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
    `;

    document.body.appendChild(previewPlayer);
}

export function initPlayerHook() {
    const video = getVideoElement();
    if (video) {
        video.addEventListener("timeupdate", onTimeUpdate);
    } else {
        const observer = new MutationObserver(() => {
            const v = getVideoElement();
            if (v) {
                v.addEventListener("timeupdate", onTimeUpdate);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}