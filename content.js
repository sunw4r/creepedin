let dataList = [];

function checkDivChanges() {
  const targetDivs = document.querySelectorAll('.ember-view.lt-line-clamp.lt-line-clamp--single-line.org-people-profile-card__profile-title.t-black');
  dataList = [];

  for (let i = 0; i < targetDivs.length; i++) {
    let textContent = targetDivs[i].textContent.trim();
    if (textContent != "LinkedIn Member") {
      dataList.push(textContent);
    }
  }

  chrome.storage.local.set({ dataList });
  chrome.runtime.sendMessage({ type: "DOM_MUTATION", details: "checkLiveChanges" });

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