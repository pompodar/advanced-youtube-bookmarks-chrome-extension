import { getActiveTabURL } from "./utils.js";
import { getSecondsFromTime } from "./helpers/getSecondsFromTime.js";
import { removeEmojis } from "./helpers/removeEmojis.js";

document.addEventListener("DOMContentLoaded", async () => {
    let bookmarksOnly = [];
    const playAll = document.querySelector("#playAll");
    playAll.src = "assets/play.png";

    const playBookmarksSequentially = (bookmarks) => {
        let index = 0;
        const playNextBookmark = async () => {
            if (index < bookmarks.length) {
                const bookmark = bookmarks[index];
                await playBookmark(bookmark);
                index++;
                setTimeout(playNextBookmark, (getSecondsFromTime(bookmark.end) - getSecondsFromTime(bookmark.start)) * 1000);
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
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (data) => {
                let bookmark = null;
                let bookmarks = [];
                Object.keys(data).forEach((key) => {
                    const bookmarks = JSON.parse(data[key]);
                    const parsedBookmark = {};
                    parsedBookmark[key] = bookmarks;
                    for (let index = 0; index < bookmarks.length; index++) {
                        const element = bookmarks[index];
                        bookmarksOnly.push(element);
                    }
                    parsedBookmarks.push(parsedBookmark);
                });

                const container = document.querySelector(".all-bookmarks");
                parsedBookmarks.forEach((parsedBookmark) => {
                    const videoKey = Object.keys(parsedBookmark)[0];
                    const bookmarks = parsedBookmark[videoKey];
                    if (bookmarks.length < 1) return false;
                    const videoContainer = document.createElement("div");
                    videoContainer.classList.add("video-container");
                    const videoHeading = document.createElement("h2");
                    const title = removeEmojis(bookmarks[0].title);
                    
                    videoHeading.textContent = title.length > 30 ? `${title.substring(0, 30)}...` : title;

                    //videoContainer.appendChild(videoHeading);
                    const bookmarksList = document.createElement("ul");
                    bookmarks.forEach((bookmark) => {
                        const bookmarkItem = document.createElement("li");
                        bookmarkItem.textContent = bookmark.desc.length > 45 ? `${bookmark.desc.substring(0, 45)}...` : bookmark.desc;
                        bookmarkItem.className = "bookmarkItem";
                        const deleteButton = document.createElement("img");
                        deleteButton.src = "assets/delete.png";
                        deleteButton.className = "delete-button";
                        const playButton = document.createElement("img");
                        playButton.src = "assets/play.png";
                        playButton.className = "play-button";
                        deleteButton.addEventListener("click", () => {
                            chrome.storage.sync.get(videoKey, (data) => {
                                const updatedBookmarks = JSON.parse(data[videoKey]).filter(b => b.start !== bookmark.start);
                                chrome.storage.sync.set({ [videoKey]: JSON.stringify(updatedBookmarks) });
                            });
                            bookmarkItem.remove();
                        });
                        bookmarkItem.appendChild(playButton);
                        bookmarkItem.appendChild(deleteButton);
                        playButton.addEventListener("click", () => {
                            for (let index = 0; index < document.querySelectorAll(".bookmarkItem").length; index++) {
                                const element = document.querySelectorAll(".bookmarkItem")[index];
                                element.classList.remove("active");
                            }
                            bookmarkItem.classList.add("active");
                            chrome.runtime.sendMessage({
                                type: "PLAY_BOOKMARK",
                                videoKey: videoKey,
                                bookmark: bookmark
                            });
                        });
                        bookmarksList.appendChild(bookmarkItem);
                    });
                    videoContainer.appendChild(bookmarksList);
                    container.appendChild(videoContainer);
                });
                resolve(data ? parsedBookmarks : []);
            });
        });
    };

    fetchAllBookmarks();

    playAll.addEventListener("click", async () => {
        playBookmarksSequentially(bookmarksOnly);
    });
});
