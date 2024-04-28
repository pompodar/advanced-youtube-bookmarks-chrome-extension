chrome.tabs.onUpdated.addListener((tabId, tab) => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHANGE_URL") {
      setTimeout(() => {
        console.log("yes");
        chrome.tabs.sendMessage(tabId, { type: "PAUSE_VIDEO", value: message.interval });
      }, 2000);

      chrome.tabs.update({ url: message.url });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_POPUP") {
    chrome.windows.create({
      url: `window.html?currentVideo=${message.value}&videoStart=${message.start}&videoEnd=${message.end}`,
      type: "popup",
      width: 400,
      height: 480,
    });
  }
});

