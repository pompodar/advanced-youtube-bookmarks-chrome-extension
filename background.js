let timer;

const getSecondsFromTime = (timeString) => {
  const timeParts = timeString.split(":");
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  const seconds = parseInt(timeParts[2]);
  return hours * 3600 + minutes * 60 + seconds;
};

const playBookmark = (videoKey, bookmark, tabId) => {
  console.log(`Playing bookmark for video ${videoKey}: ${bookmark.desc}`);
  const startPoint = getSecondsFromTime(bookmark.start);
  const endPoint = getSecondsFromTime(bookmark.end);
  const interval = (endPoint - startPoint) + 1;
  // Construct the new YouTube video URL
  const newUrl = `https://www.youtube.com/watch?v=${videoKey}&t=${startPoint}s`;
  // Update the tab with the new URL
  chrome.tabs.update({ url: newUrl });
  timer = setTimeout(() => {
    chrome.tabs.sendMessage(tabId, { type: "PAUSE_VIDEO" });
  }, interval * 1000);
};

clearTimeout(timer);

// Listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, tab) => {
  clearTimeout(timer);
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    // Listener for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "PLAY_BOOKMARK") {
        const { videoKey, bookmark } = message;
        playBookmark(videoKey, bookmark, tabId);
      }
    });
  }
});

// Listener for messages from popup
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
