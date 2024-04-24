import { getActiveTabURL } from "./utils.js";

const getSecondsFromTime = (timeString) => {
  const timeParts = timeString.split(":");
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  const seconds = parseInt(timeParts[2]);
  
  return hours * 3600 + minutes * 60 + seconds;
};

const addNewBookmark = async (bookmarks, bookmark) => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");
  const startInput = document.createElement("input");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.start;
  newBookmarkElement.className = "bookmark";
  
  newBookmarkElement.setAttribute("start", getSecondsFromTime(bookmark.start));

  newBookmarkElement.setAttribute("end", getSecondsFromTime(bookmark.end));


  // Create an input field for description editing
  startInput.type = "text";
  startInput.value = bookmark.start;
  startInput.className = "bookmark-start-input";
  startInput.addEventListener("blur", () => {
    const newStartTime = startInput.value;
    newBookmarkElement.id = "bookmark-" + newStartTime; // Update bookmark ID

    newBookmarkElement.setAttribute("start", getSecondsFromTime(newStartTime));

    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

      console.log(data);
      const index = currentVideoBookmarks.findIndex(b => b.start === bookmark.start);
      if (index !== -1) {
        currentVideoBookmarks[index].start = newStartTime; // Update start time in storage
        chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
      }
    });
  });

  newBookmarkElement.appendChild(startInput); // Add the input field to the bookmark element
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};


const viewBookmarks = (currentBookmarks=[]) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }

  return;
};

const onPlay = async e => {
  const start = e.target.parentNode.parentNode.getAttribute("start");

  const end = e.target.parentNode.parentNode.getAttribute("end");

  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: {"start": start, "end": end},
  });
};

const onDelete = async e => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("start");
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );

  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
  }, viewBookmarks);
};

const setBookmarkAttributes =  (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

const playAll = document.querySelector("#playAll");

console.log(playAll);

const playBookmarksSequentially = (bookmarks) => {
  let index = 0;

  const playNextBookmark = async () => {
    if (index < bookmarks.length) {
      const bookmark = bookmarks[index];
      console.log(bookmark);
      await playBookmark(bookmark);
      index++;
      setTimeout(playNextBookmark, (getSecondsFromTime(bookmark.end) - getSecondsFromTime(bookmark.start)) * 1000); // Delay equal to bookmark length in milliseconds
    }
  };

  playNextBookmark();
};


const playBookmark = async (bookmark) => {
  const startTime = getSecondsFromTime(bookmark.start);
  const endTime = getSecondsFromTime(bookmark.end);

  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: {"start": startTime, "end": endTime},
  });
};

const fetchBookmarks = async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  return new Promise((resolve) => {
    chrome.storage.sync.get([currentVideo], (obj) => {
      resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
    });
  });
};


playAll.addEventListener("click", async () => {
    const currentVideoBookmarks = await fetchBookmarks();
    playBookmarksSequentially(currentVideoBookmarks);
})


document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

      viewBookmarks(currentVideoBookmarks);

    });
  } else {
    const container = document.getElementsByClassName("container")[0];

    container.innerHTML = '<div class="title">This is not a youtube video page.</div>';
  }
});

