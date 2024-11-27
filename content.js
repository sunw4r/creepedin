let dataList = [];

//Check if URL is the correct one (needed to work without reloading the page)
function checkURL() {
  const regex = /^https:\/\/www\.linkedin\.com\/company\/[^\/]+\/people\//;
  if (regex.test(window.location.href)) {
    return true;
  }
  return false;
}

//Start analyzing the changes and fetch the names
function checkDivChanges() {
  if (checkURL()) {
    const targetDivs = document.querySelectorAll('.ember-view.lt-line-clamp.lt-line-clamp--single-line');
    dataList = [];

    for (let i = 0; i < targetDivs.length; i++) {
      let textContent = targetDivs[i].innerText;
      if (!textContent.toLowerCase().includes('linkedin')) {
        dataList.push(textContent);
      }
    }

    chrome.storage.local.set({ dataList });
    chrome.runtime.sendMessage({ type: "DOM_MUTATION", details: "checkLiveChanges" });
  }
}

const config = { childList: true, subtree: true };
const callback = function (mutationsList) {

  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      checkDivChanges();
    }
  }

};

const targetNode = document.body;
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

checkDivChanges();