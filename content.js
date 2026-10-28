let dataList = [];
let isAutoscrolling = false;
let autoscrollInterval = null;

function checkURL() {
    return (
        /^https:\/\/www\.linkedin\.com\/company\/[^/]+\/people\/?/.test(
            window.location.href
        ) ||
        /^https:\/\/www\.linkedin\.com\/search\/results\/people\//.test(
            window.location.href
        )
    );
}

function extractNameFromItem(item) {
    const links = item.querySelectorAll('a[href*="/in/"]');
    for (let link of links) {
        const container =
            link.querySelector("div[id]") || link.querySelector("p");
        if (!container) continue;
        const name = Array.from(container.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent.trim())
            .join(" ")
            .trim();
        if (name && !name.toLowerCase().includes("linkedin")) {
            return name;
        }
    }
    return null;
}

function checkDivChanges() {
    if (!checkURL()) return;

    const items = document.querySelectorAll('[role="listitem"]');
    const seen = new Set(dataList);
    let added = false;

    for (let item of items) {
        const name = extractNameFromItem(item);
        if (name && !seen.has(name)) {
            seen.add(name);
            dataList.push(name);
            added = true;
        }
    }

    if (added) {
        chrome.storage.local.set({ dataList });
        chrome.runtime.sendMessage({
            type: "DOM_MUTATION",
            details: "checkLiveChanges",
        });
    }
}

function clickNextPage() {
    const paginationButtons = document.querySelectorAll(
        '[data-testid^="pagination-indicator-"]'
    );
    for (let btn of paginationButtons) {
        if (btn.getAttribute("aria-current") === "true") {
            const nextLi = btn.closest("li")?.nextElementSibling;
            const nextBtn = nextLi?.querySelector("button");
            if (nextBtn) {
                nextBtn.click();
                return true;
            }
            return false;
        }
    }
    return false;
}

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scheduleNextClick() {
    if (!isAutoscrolling) return;
    const delay = randomDelay(7000, 23000);
    autoscrollInterval = setTimeout(() => {
        if (!isAutoscrolling) return;
        checkDivChanges();
        if (clickNextPage()) {
            scheduleNextClick();
        } else {
            isAutoscrolling = false;
            chrome.runtime.sendMessage({ type: "AUTOSCROLL_DONE" });
        }
    }, delay);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AUTOSCROLL") {
        if (message.active) {
            isAutoscrolling = true;
            checkDivChanges();
            scheduleNextClick();
        } else {
            isAutoscrolling = false;
            clearTimeout(autoscrollInterval);
        }
    }
});

const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            checkDivChanges();
            break;
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });

checkDivChanges();
