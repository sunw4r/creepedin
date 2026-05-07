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
        // Query all tabs to find those with linkedin.com in their URL
        chrome.tabs.query({ url: "https://www.linkedin.com/*" }, (tabs) => {
            console.log("Tabs query result:", tabs);

            if (tabs.length > 0) {
                // Get the first tab whose URL contains /people/
                const peopleTab = tabs.find(tab => tab.url.includes("/people/"));
                if (peopleTab) {
                    console.log("Found people tab:", peopleTab);
                    chrome.tabs.sendMessage(
                        peopleTab.id,
                        {
                            type: "AUTOSCROLL",
                            active: message.active,
                        }
                    );
                } else {
                    console.error("No tabs with /people/ found");
                }
            } else {
                console.error("No tabs with linkedin.com found");
            }
        });
    }
});
