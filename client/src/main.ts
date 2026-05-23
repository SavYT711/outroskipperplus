import { initPlayerHook } from "./playerHook";

// Wait for Jellyfin to finish loading before initialising
function waitForJellyfin() {
    const apiClient = (window as any).ApiClient;
    if (apiClient) {
        initPlayerHook();
    } else {
        setTimeout(waitForJellyfin, 500);
    }
}

waitForJellyfin();