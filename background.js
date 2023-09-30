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
