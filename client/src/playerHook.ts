import { fetchNextEpisodeInfo, createOverlay, removeOverlay } from "./index";
import type { NextEpisodeInfo } from "./index";

const TICKS_PER_SECOND = 10_000_000;

let overlayShown = false;
let currentItemId: string | null = null;
let cachedInfo: NextEpisodeInfo | null = null;
let pluginConfig: any = null;

export async function loadPluginConfig() {
    const response = await fetch("/OutroSkipperPlus/Configuration");
    if (response.ok) {
        pluginConfig = await response.json();
    }
}


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
    if (!pluginConfig?.isEnabled) return;

    // Attach pause/seek listeners once per video element
    if (!(video as any)._ospListeners) {
        (video as any)._ospListeners = true;
        video.addEventListener("pause", () => {
            removeOverlay();
            overlayShown = false;
        });
        video.addEventListener("seeking", () => {
            removeOverlay();
            overlayShown = false;
        });
    }

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
        if (!cachedInfo) {
            //Last episode or no next episode, the pop up doesn't show
            return;
        }
        (window as any)._ospCachedInfo = cachedInfo;
    }

    if (!cachedInfo) return;

    // Temporary: use 30 seconds as fallback for testing
    const countdown = pluginConfig?.countdownSeconds ?? 30;
    const outroStartTicks = cachedInfo.outroStartTicks ?? ((video.duration - countdown) * 10_000_000);
    const outroStartSeconds = ticksToSeconds(outroStartTicks);
    const currentTime = video.currentTime;

    // Show overlay when outro starts
    if (!overlayShown && currentTime >= outroStartSeconds) {
    overlayShown = true;
    const overlay = createOverlay(cachedInfo);
    document.body.appendChild(overlay);
    setTimeout(() => {
        const el = document.getElementById("osp-overlay");
        if (el) el.style.opacity = "1";
    }, 50);

    // Silently buffer the next episode in the background
    startPreview(cachedInfo!.nextEpisodeId);

    document.getElementById("osp-watch-btn")?.addEventListener("click", () => {
        const preview = document.getElementById("osp-preview-player") as HTMLVideoElement;
        if (preview) {
            preview.remove();
        }
        // Navigate to next episode
        const apiClient = (window as any).ApiClient;
        apiClient.navigateTo?.(`/details?id=${cachedInfo!.nextEpisodeId}`);
        removeOverlay();
    });

    document.getElementById("osp-dismiss-btn")?.addEventListener("click", () => {
        removeOverlay();
        overlayShown = false;
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
        bottom: 280px;
        right: 30px;
        width: 600px;
        aspect-ratio: 16/9;
        border-radius: 8px;
        z-index: 9998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    `;

    document.body.appendChild(previewPlayer);
    setTimeout(() => {
        const el = document.getElementById("osp-preview-player");
        if (el) el.style.opacity = "1";
    }, 50);
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

    // Dismiss overlay when player is closed
    window.addEventListener("hashchange", () => {
        if (!window.location.hash.includes("video")) {
            removeOverlay();
            overlayShown = false;
            currentItemId = null;
            cachedInfo = null;
        }
    });
}