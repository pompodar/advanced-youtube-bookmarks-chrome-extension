chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
    });

    

    const getSecondsFromTime = (timeString) => {
      const timeParts = timeString.split(":");
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      const seconds = parseInt(timeParts[2]);
      
      return hours * 3600 + minutes * 60 + seconds;
    };

    let timer;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "PLAY_BOOKMARK") {
        const { videoKey, bookmark } = message;
        console.log(`Playing bookmark for video ${videoKey}: ${bookmark.desc}`);

        const startPoint = getSecondsFromTime(bookmark.start);

        const endPoint = getSecondsFromTime(bookmark.end);
    
        const interval = (endPoint - startPoint) + 1;
        // Construct the new YouTube video URL
        const newUrl = `https://www.youtube.com/watch?v=${videoKey}&t=${startPoint}s`;
    
        chrome.tabs.update({ url: newUrl });       
        
        clearTimeout(timer);

        // After a certain duration (e.g., 60 seconds), send message to pause the video
    timer = setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { type: "PAUSE_VIDEO" });
    }, interval * 1000); 
    
      }
    });
      
  }
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

