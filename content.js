let dataList = [];
let isAutoscrolling = false;
let scrollInterval = null;
let throttleTimeout = null;

// Check if URL is the correct one (needed to work without reloading the page)
function checkURL() {
    const regex = /^https:\/\/www\.linkedin\.com\/company\/[^\/]+\/people\//;
    return regex.test(window.location.href);
}

// Throttle function to prevent excessive checks
function throttle(func, limit) {
    return function () {
        if (!throttleTimeout) {
            throttleTimeout = setTimeout(() => {
                func.apply(this, arguments);
                throttleTimeout = null;
            }, limit);
        }
    };
}

// Fetch names and analyze changes
function checkDivChanges() {
    if (checkURL()) {
        const targetDivs = document.querySelectorAll(
            ".ember-view.lt-line-clamp.lt-line-clamp--single-line.org-people-profile-card__profile-title.t-black"
        );
        dataList = [];

        for (let i = 0; i < targetDivs.length; i++) {
            let textContent = targetDivs[i].textContent.trim();
            if (!textContent.toLowerCase().includes("linkedin")) {
                dataList.push(textContent);
            }
        }

        chrome.storage.local.set({ dataList });
        chrome.runtime.sendMessage({
            type: "DOM_MUTATION",
            details: "checkLiveChanges",
        });
    }
}

// Handle messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AUTOSCROLL") {
        if (message.active) {
            // Start autoscroll
            isAutoscrolling = true;
            scrollInterval = setInterval(() => {
                window.scrollBy(0, 10); // Scroll down by 10 pixels
                if (
                    window.innerHeight + window.scrollY >=
                    document.body.scrollHeight
                ) {
                    clearInterval(scrollInterval);
                }
            }, 100); // Adjust the scroll speed
        } else {
            // Stop autoscroll
            isAutoscrolling = false;
            clearInterval(scrollInterval);
        }
    }
});

// Create a throttled version of checkDivChanges to prevent excessive calls
const throttledCheckDivChanges = throttle(checkDivChanges, 200);

// MutationObserver to monitor changes in the DOM
const config = { childList: true, subtree: true };
const callback = function (mutationsList) {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            throttledCheckDivChanges(); // Use throttled function
        }
    }
};

// Observe changes in the DOM body
const targetNode = document.body;
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

// Initial check when the content script runs
checkDivChanges();
