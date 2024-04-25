// Function to parse URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return (decodeURIComponent(results[2].replace(/\+/g, ' ')));
}

const currentVideo = getUrlParameter('currentVideo');

const getSecondsFromTime = (timeString) => {
    const timeParts = timeString.split(":");
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = parseInt(timeParts[2]);
    
    return hours * 3600 + minutes * 60 + seconds;
  };

chrome.storage.sync.get(null, (data) => {
    let bookmark = null;
    let bookmarks = [];
  
    // Iterate over all items in storage
    Object.keys(data).forEach((key) => {
        if (key === currentVideo) {
            bookmarks = JSON.parse(data[key]); // Parse the stored bookmarks
  
            // Check if there are any bookmarks
            if (bookmarks && bookmarks.length > 0) {
              // Take the first bookmark
              bookmark = bookmarks[0];
              // Exit the loop since we found the first bookmark
              return;
            }
        }
    });
  
    if (bookmark) {

        const newBookmark = document.querySelector("#newBookmark");
        const bookmarkTitleElement = document.createElement("div");
        const controlsElement = document.createElement("div");
        const newBookmarkElement = document.createElement("div");
        const startInput = document.createElement("input");
        const descInput = document.createElement("input");

      
        bookmarkTitleElement.textContent = bookmark.desc;
        bookmarkTitleElement.className = "bookmark-title";
        controlsElement.className = "bookmark-controls";
    
      
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

        descInput.type = "text";
        descInput.value = bookmark.desc;
        descInput.className = "bookmark-desc-input";

        descInput.addEventListener("blur", () => {
            const newDesc = descInput.value;
                
            chrome.storage.sync.get([currentVideo], (data) => {
              const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
        
              console.log(data);
              const index = currentVideoBookmarks.findIndex(b => b.start === bookmark.start);
              if (index !== -1) {
                currentVideoBookmarks[index].desc = newDesc; // Update start time in storage
                chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
              }

              console.log(currentVideoBookmarks);

            });
          });
      
        newBookmarkElement.appendChild(descInput); 

        newBookmarkElement.appendChild(startInput);

        newBookmarkElement.appendChild(controlsElement);
        newBookmark.appendChild(newBookmarkElement);
    } else {
      console.log("No bookmarks found in storage.");
    }
  });

  const onPlay = async e => {
    const start = e.target.parentNode.parentNode.getAttribute("start");
  
    const end = e.target.parentNode.parentNode.getAttribute("end");
  
    const activeTab = await getActiveTabURL();
  
    chrome.tabs.sendMessage(activeTab.id, {
      type: "PLAY",
      value: {"start": start, "end": end},
    });
  };
