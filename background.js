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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TOGGLE_AUTOSCROLL") {
        // Query all tabs to find those with linkedin.com in their URL
        chrome.tabs.query({ url: "https://www.linkedin.com/*" }, (tabs) => {
            console.log("Tabs query result:", tabs);

            if (tabs.length > 0) {
                // Target the first tab with linkedin.com
                const tab = tabs[0];
                console.log("Found tab:", tab);
                chrome.tabs.sendMessage(
                    tab.id,
                    {
                        type: "AUTOSCROLL",
                        active: message.active,
                    }
                );
            } else {
                console.error("No tabs with linkedin.com found");
            }
        });
    }
});
