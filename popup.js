import { getActiveTabURL } from "./utils.js";
let bookmarksOnly = [];

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

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};

const onDelete = async e => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = getTime(e.target.parentNode.parentNode.getAttribute("start"));
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );

  console.log(bookmarkTime);

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

const playBookmarksSequentially = (bookmarks) => {
  let index = 0;

  const playNextBookmark = async () => {
    if (index < bookmarks.length) {
      const bookmark = bookmarks[index];
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

// const fetchBookmarks = async () => {
//   const activeTab = await getActiveTabURL();
//   const queryParameters = activeTab.url.split("?")[1];
//   const urlParameters = new URLSearchParams(queryParameters);

//   const currentVideo = urlParameters.get("v");

//   return new Promise((resolve) => {
//     chrome.storage.sync.get([currentVideo], (obj) => {
//       resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
//     });
//   });
// };

const parsedBookmarks = [];


const fetchAllBookmarks = async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (data) => {
      let bookmark = null;
      let bookmarks = [];

      Object.keys(data).forEach((key) => {
        const bookmarks = JSON.parse(data[key]); // Parse the stored bookmarks
        const parsedBookmark = {};
        parsedBookmark[key] = bookmarks;

        for (let index = 0; index < bookmarks.length; index++) {
          const element = bookmarks[index];
          bookmarksOnly.push(element);
        }
        parsedBookmarks.push(parsedBookmark);
      });

// Assume parsedBookmarks array is populated as per your code

// Get the container element where you want to populate the bookmarks
const container = document.querySelector(".all-bookmarks");

// Iterate over each parsed bookmark object
parsedBookmarks.forEach((parsedBookmark) => {
  // Get the video key and the corresponding bookmarks array
  const videoKey = Object.keys(parsedBookmark)[0];
  const bookmarks = parsedBookmark[videoKey];

  // Create a container element for this video
  const videoContainer = document.createElement("div");
  videoContainer.classList.add("video-container");

  // Create a heading element for the video key
  const videoHeading = document.createElement("h2");
  videoHeading.textContent = bookmarks[0].title;
  videoContainer.appendChild(videoHeading);

  // Create a list element to display the bookmarks
  const bookmarksList = document.createElement("ul");

  // Iterate over each bookmark in the bookmarks array
  bookmarks.forEach((bookmark) => {
    // Create a list item element for each bookmark
    const bookmarkItem = document.createElement("li");
    bookmarkItem.textContent = `${bookmark.desc} - Start: ${bookmark.start}, End: ${bookmark.end}`;

    const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";

  // Attach a click event listener to the delete button
  deleteButton.addEventListener("click", () => {
    // Remove the bookmark from storage

    chrome.storage.sync.get(videoKey, (data) => {
      const updatedBookmarks = data[videoKey].filter(b => b.start !== getSecondsFromTime(bookmark.start));
      chrome.storage.sync.set({ [videoKey]: updatedBookmarks });
    });

    // Remove the bookmark item from the DOM
    bookmarkItem.remove();
  });

  // Append the delete button to the bookmark item
  bookmarkItem.appendChild(deleteButton);

  // Append the list item to the bookmarks list
  bookmarksList.appendChild(bookmarkItem);

    // Attach a click event listener to the bookmark item
    bookmarkItem.addEventListener("click", () => {
      // Send a message to the background script to play the bookmark
      chrome.runtime.sendMessage({
        type: "PLAY_BOOKMARK",
        videoKey: videoKey,
        bookmark: bookmark
      });
    });

    // Append the list item to the bookmarks list
    bookmarksList.appendChild(bookmarkItem);
  });

  // Append the bookmarks list to the video container
  videoContainer.appendChild(bookmarksList);

  // Append the video container to the main container
  container.appendChild(videoContainer);
});

      resolve(data ? parsedBookmarks : []);

    });
  });
};

fetchAllBookmarks();


playAll.addEventListener("click", async () => {
    playBookmarksSequentially(bookmarksOnly);
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

