chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {

    chrome.tabs.get(tabId, (tab) => {

        if (chrome.runtime.lastError) {
            return;
        }

        if (tab.url && tab.url.includes('linkedin.com')) {
            chrome.storage.local.clear(() => {
                console.log('CreepedIn Storage cleared');
            });
        }

    });

});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "TOGGLE_AUTOSCROLL") {
        console.log("Received message in background script:", message);
        chrome.tabs.query({ url: "https://www.linkedin.com/*" }, (tabs) => {
            if (tabs.length === 0) return;
            const targetTab = tabs.find(
                (tab) =>
                    tab.url.includes("/search/results/people/") ||
                    tab.url.includes("/people/")
            );
            if (targetTab) {
                chrome.tabs.sendMessage(targetTab.id, {
                    type: "AUTOSCROLL",
                    active: message.active,
                });
            }
        });
    }
});
