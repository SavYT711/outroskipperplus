import { initPlayerHook, loadPluginConfig } from "./playerHook";

async function waitForJellyfin() {
    const apiClient = (window as any).ApiClient;
    if (apiClient) {
        await loadPluginConfig();
        initPlayerHook();
    } else {
        setTimeout(waitForJellyfin, 500);
    }
}

waitForJellyfin();