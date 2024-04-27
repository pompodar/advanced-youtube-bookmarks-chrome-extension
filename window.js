// chrome.storage.sync.clear(() => {
//     console.log("Storage data cleared successfully.");
//   });
  

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

  const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);
  
    return date.toISOString().substr(11, 8);
  };

  const start = getTime(getUrlParameter('videoStart'));

  const end = getTime(getUrlParameter('videoEnd'));


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

        const newBookmark = document.querySelector(".container");
        const bookmarkTitleElement = document.querySelector("div");
        const controlsElement = document.createElement("div");
        const newBookmarkElement = document.createElement("div");
        const title = document.createElement("h1");
        const startInput = document.createElement("input");
        const endInput = document.createElement("input");
        const submit = document.createElement("button");


        const descInput = document.createElement("input");

        const image = document.createElement("img");

        const youtube = (function () {
            let video, results;
        
            const getThumbnail = function (url, size) {
                if (url == null) {
                    return '';
                }
            
                size = (size == null) ? 'big' : size;
                results = url.match('[\\?&]v=([^&#]*)');
                video = (results == null) ? url : results[1];
        
                if (size == 'small') {
                    return `http://img.youtube.com/vi/${video}/2.jpg`;
                }
        
                return `http://img.youtube.com/vi/${video}/0.jpg`;
            };
        
            return {
                thumbnail: getThumbnail
            };
        }());
                
        const thumbnail = youtube.thumbnail("http://www.youtube.com/watch?v=" + currentVideo, "high");

        image.src = thumbnail;
      
        title.textContent = bookmark.title;
        bookmarkTitleElement.className = "bookmark-title";
        controlsElement.className = "bookmark-controls";
    
      
        newBookmarkElement.id = "bookmark-" + bookmark.start;
        newBookmarkElement.className = "bookmark";

        submit.className = "submitButton";
        
        newBookmarkElement.setAttribute("start", getSecondsFromTime(bookmark.start));
      
        newBookmarkElement.setAttribute("end", getSecondsFromTime(bookmark.end));
      
      
        startInput.type = "text";
        startInput.value = start;
        startInput.className = "bookmark-start-input";
        
        endInput.type = "text";
        endInput.value = end;
        endInput.className = "bookmark-end-input";
        
        descInput.type = "text";
        descInput.value = "";
        descInput.placeholder = "Title";
        descInput.className = "bookmark-desc-input";

        submit.textContent = "Submit";

        submit.addEventListener("click", () => {
            const newDesc = descInput.value;
            const newStartTime = startInput.value;
            const newEndTime = endInput.value;

                
            chrome.storage.sync.get([currentVideo], (data) => {
              const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
        
              const index = currentVideoBookmarks.findIndex(b => b.start === start);
              if (index !== -1) {
                currentVideoBookmarks[index].desc = newDesc; 
                currentVideoBookmarks[index].start = newStartTime; 
                currentVideoBookmarks[index].end = newEndTime; 

                chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
              }

              chrome.windows.getCurrent(window => {
                chrome.windows.remove(window.id);
              });

            });
          });
              
        newBookmark.appendChild(image); 

        newBookmarkElement.appendChild(title); 

        newBookmarkElement.appendChild(descInput); 

        newBookmarkElement.appendChild(startInput);

        newBookmarkElement.appendChild(endInput);

        newBookmarkElement.appendChild(submit);

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
