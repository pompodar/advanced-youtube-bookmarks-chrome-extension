(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;

    function getUrlParameter(name) {
      name = name.replace(/[\[\]]/g, '\\$&');
      const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
      const results = regex.exec(window.location.href);
      if (!results) return null;
      if (!results[2]) return '';
      return (decodeURIComponent(results[2].replace(/\+/g, ' ')));
    }
  
    const currentVideo = getUrlParameter('v');

    const videoTitle = document.querySelector("#title h1 .style-scope.ytd-watch-metadata").textContent;

    const endTime = currentTime + 60;

    const newBookmark = {
      start: getTime(currentTime),
      end: getTime(endTime),
      desc: "",
      title: videoTitle,
    };

    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.start - b.start))
    }, () => {
      chrome.runtime.sendMessage({ type: "OPEN_POPUP", value: currentVideo, start: currentTime, end: endTime  });
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.style.height = "50%";
      bookmarkBtn.style.width = "24px";
      bookmarkBtn.style.position = "relative";
      bookmarkBtn.style.top = "24%";


      bookmarkBtn.title = "Click to bookmark current timestamp";

      youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      youtubeLeftControls.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {

      youtubePlayer.currentTime = value.start;

      youtubePlayer.play();

      const pauseAtEndTime = () => {
        if (youtubePlayer.currentTime >= value.end) {
          youtubePlayer.pause();
          youtubePlayer.removeEventListener('timeupdate', pauseAtEndTime);
        }
      };
  
      youtubePlayer.addEventListener('timeupdate', pauseAtEndTime);

    } else if ( type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
      chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

      response(currentVideoBookmarks);
    } 
  });

  newVideoLoaded();
})();

const getTime = t => {
  const date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PLAY_VIDEOsic") {
    const player = document.querySelector('video');
    if (player) {
      player.play();
    }
  } else if (message.type === "PAUSE_VIDEO") {
    let youtubePlayer = document.getElementsByClassName('video-stream')[0];

    youtubePlayer.pause();
  }
});
