import { getActiveTabURL } from "./utils.js";

import { getSecondsFromTime } from "./helpers/getSecondsFromTime.js";

document.addEventListener("DOMContentLoaded", async () => {

let bookmarksOnly = [];

// chrome.storage.sync.clear(() => {
//    console.log('Storage cleared successfully.');
// });


const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};


const playAll = document.querySelector("#playAll");

playAll.src = "assets/play.png";

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


const parsedBookmarks = [];


const fetchAllBookmarks = async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];

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

// Get the container element where you want to populate the bookmarks
const container = document.querySelector(".all-bookmarks");

// Iterate over each parsed bookmark object
parsedBookmarks.forEach((parsedBookmark) => {
  // Get the video key and the corresponding bookmarks array
  const videoKey = Object.keys(parsedBookmark)[0];
  const bookmarks = parsedBookmark[videoKey];

  if (bookmarks.length < 1) return false;

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
    bookmarkItem.textContent = `${bookmark.desc}`;
    bookmarkItem.className = "bookmarkItem";


    //  - ${bookmark.start} - ${bookmark.end}

    const deleteButton = document.createElement("img");
  deleteButton.src = "assets/delete.png";
  deleteButton.className = "delete-button";


  const playButton = document.createElement("img");
  playButton.src = "assets/play.png";
  playButton.className = "play-button";

  // Attach a click event listener to the delete button
  deleteButton.addEventListener("click", () => {
    // Remove the bookmark from storage

    chrome.storage.sync.get(videoKey, (data) => {

      const updatedBookmarks = JSON.parse(data[videoKey]).filter(b => b.start !== bookmark.start);      
      chrome.storage.sync.set({ [videoKey]: JSON.stringify(updatedBookmarks) });
    });

    // Remove the bookmark item from the DOM
    bookmarkItem.remove();
  });

  bookmarkItem.appendChild(playButton);

  
  // Append the delete button to the bookmark item
  bookmarkItem.appendChild(deleteButton);



  // Append the list item to the bookmarks list
  bookmarksList.appendChild(bookmarkItem);

    // Attach a click event listener to the bookmark item
    playButton.addEventListener("click", () => {
      // Send a message to the background script to play the bookmark
      
      for (let index = 0; index < document.querySelectorAll(".boolmarkItem").length; index++) {
        console.log(1);
        const element = document.querySelectorAll(".boolmarkItem")[index];
        element.classList.remove("active");      
      }

      bookmarkItem.classList.add("active");
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



});

