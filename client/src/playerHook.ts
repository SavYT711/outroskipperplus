import type { NextEpisodeInfo } from "./index";
import { fetchNextEpisodeInfo, createOverlay, createLastEpisodeOverlay, removeOverlay } from "./index";

const TICKS_PER_SECOND = 10_000_000;

let overlayShown = false;
let wasDismissed = false;
let currentItemId: string | null = null;
let cachedInfo: NextEpisodeInfo | null = null;
let pluginConfig: any = null;
let checkedForNext = false;
let videoOriginalParent: Element | null = null;
let videoNextSibling: Element | null = null;
let currentItemType: string = 'Series';

export async function loadPluginConfig() {
    const response = await fetch("/OutroSkipperPlus/Configuration");
    if (response.ok) {
        pluginConfig = await response.json();
    }
}

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

function shrinkVideoToMiniPlayer() {
    const video = getVideoElement();
    if (!video) return;
    videoOriginalParent = video.parentElement;
    videoNextSibling = video.nextElementSibling;

    // Get current position before moving
    const rect = video.getBoundingClientRect();
    document.body.appendChild(video);

    // Set initial position matching original location
    video.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border-radius: 0px;
        z-index: 10000;
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.8);
    `;

    // Trigger transition to mini player position
    setTimeout(() => {
        video.style.top = "";
        video.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 320px;
            aspect-ratio: 16/9;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.8);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        `;
    }, 50);
}

function restoreVideo() {
    const video = getVideoElement();
    if (!video) return;
    video.style.cssText = "";
    if (videoOriginalParent) {
        if (videoNextSibling) {
            videoOriginalParent.insertBefore(video, videoNextSibling);
        } else {
            videoOriginalParent.appendChild(video);
        }
        videoOriginalParent = null;
        videoNextSibling = null;
    }
}

async function onTimeUpdate() {
    const video = getVideoElement();
    if (!video) return;
    if (!pluginConfig?.isEnabled) return;

    if (!(video as any)._ospListeners) {
        (video as any)._ospListeners = true;
        video.addEventListener("pause", () => {
            removeOverlay();
            restoreVideo();
            overlayShown = false;
        });
        video.addEventListener("seeking", () => {
            removeOverlay();
            restoreVideo();
            overlayShown = false;
            wasDismissed = false;
        });
    }

    const context = getCurrentJellyfinContext();
    if (!context) return;

    const { itemId, userId } = context;

    if (itemId !== currentItemId) {
        currentItemId = itemId;
        cachedInfo = null;
        overlayShown = false;
        wasDismissed = false;
        checkedForNext = false;
        removeOverlay();
        restoreVideo();
        cachedInfo = await fetchNextEpisodeInfo(itemId, userId);
        // Get current item type
        const itemResponse = await fetch(`/Users/${userId}/Items/${itemId}`, {
            headers: { 'X-Emby-Token': (window as any).ApiClient.accessToken() }
        });
        if (itemResponse.ok) {
            const itemData = await itemResponse.json();
            currentItemType = itemData.Type ?? 'Series';
        }
        (window as any)._ospCachedInfo = cachedInfo;
        checkedForNext = true;
    }

    if (!cachedInfo) {
        if (!checkedForNext) return;
        if (wasDismissed) return;
        const countdown = pluginConfig?.countdownSeconds ?? 60;
        if (video.duration - video.currentTime > countdown) return;
        if (!overlayShown) {
            overlayShown = true;
            const response = await fetch(`/OutroSkipperPlus/RandomUnwatched?userId=${userId}`);
            if (response.ok) {
                const suggestion = await response.json();
                shrinkVideoToMiniPlayer();
                const overlay = createLastEpisodeOverlay(suggestion, currentItemType);
                document.body.appendChild(overlay);

                setTimeout(() => {
                    const el = document.getElementById("osp-overlay");
                    if (el) el.style.opacity = "1";
                }, 50);

                document.getElementById("osp-watch-btn")?.addEventListener("click", () => {
                    removeOverlay();
                    restoreVideo();
                    window.location.hash = `/details?id=${suggestion.itemId}`;
                });

                document.getElementById("osp-dismiss-btn")?.addEventListener("click", () => {
                    removeOverlay();
                    restoreVideo();
                    overlayShown = false;
                    wasDismissed = true;
                });
            }
        }
        return;
    }

    const countdown = pluginConfig?.countdownSeconds ?? 30;
    const outroStartTicks = cachedInfo.outroStartTicks ?? ((video.duration - countdown) * 10_000_000);
    const outroStartSeconds = ticksToSeconds(outroStartTicks);
    const currentTime = video.currentTime;

    if (!overlayShown && currentTime >= outroStartSeconds) {
        overlayShown = true;
        const overlay = createOverlay(cachedInfo);
        document.body.appendChild(overlay);

        setTimeout(() => {
            const el = document.getElementById("osp-overlay");
            if (el) el.style.opacity = "1";
        }, 50);

        startPreview(cachedInfo!.nextEpisodeId);

        document.getElementById("osp-watch-btn")?.addEventListener("click", () => {
            const preview = document.getElementById("osp-preview-player") as HTMLVideoElement;
            if (preview) preview.remove();
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

    window.addEventListener("hashchange", () => {
        if (!window.location.hash.includes("video")) {
            removeOverlay();
            restoreVideo();
            overlayShown = false;
            wasDismissed = false;
            currentItemId = null;
            cachedInfo = null;
        }
    });
}