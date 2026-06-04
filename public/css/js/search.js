function encodeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (e) {
    return false;
  }
}

let debounceTimeout;
let fuseInstance = null;
let isFetchingData = false;

// Initialize Fuse.js and fetch data only once
async function initSearchEngine() {
  if (fuseInstance || isFetchingData) return;
  isFetchingData = true;

  try {
    let indexURL = window.searchIndexURL || '/index.json';
    let response = await fetch(indexURL);
    if (!response.ok) {
      throw new Error("Failed to fetch search data");
    }

    let searchJson = await response.json();
    
    // Configure Fuse.js for fuzzy search and tokenization
    const options = {
      keys: ['title', 'description', 'content'],
      includeScore: true,
      threshold: 0.3, // 0.0 is an exact match, 1.0 matches anything. 0.3 is a good balance.
      ignoreLocation: true,
      useExtendedSearch: true
    };
    
    fuseInstance = new Fuse(searchJson, options);
  } catch (error) {
    console.error("Error initializing search engine:", error);
  } finally {
    isFetchingData = false;
  }
}

function searchOnChange(evt) {
  clearTimeout(debounceTimeout);
  
  // Start fetching the index quietly in the background as soon as they start typing
  initSearchEngine(); 

  debounceTimeout = setTimeout(() => {
    performSearch(evt);
  }, 300);
}

async function performSearch(evt) {
  let searchQuery = evt.target.value.trim();

  if (searchQuery !== "") {
    const searchButtonEle = document.querySelectorAll("#search");

    if (searchButtonEle.length < 2) {
      console.error("Search button elements missing!");
      return;
    }

    let searchButtonPosition;
    if (window.innerWidth > 768) {
      searchButtonPosition = searchButtonEle[0].getBoundingClientRect();
      document.getElementById("search-content").style.width = "500px";
    } else {
      searchButtonPosition = searchButtonEle[1].getBoundingClientRect();
      document.getElementById("search-content").style.width = "300px";
    }

    document.getElementById("search-content").style.top =
      searchButtonPosition.top + 50 + "px";
    document.getElementById("search-content").style.left =
      searchButtonPosition.left + "px";

    // Wait for Fuse to be ready if it's still fetching
    while (isFetchingData) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!fuseInstance) return; // Exit if initialization failed

    // Execute the search using Fuse
    const fuseResults = fuseInstance.search(searchQuery);
    
    // Map the nested Fuse result structure back to a flat array for rendering
    let searchResults = fuseResults.map(result => result.item);

    const searchResultsContainer = document.getElementById("search-results");
    searchResultsContainer.innerHTML = ""; 

    if (searchResults.length > 0) {
      searchResults.forEach((item) => {
        if (!item.permalink || !isValidUrl(item.permalink)) {
          console.warn("Skipping invalid search result:", item);
          return;
        }

        const card = document.createElement("div");
        card.className = "card";

        const link = document.createElement("a");
        link.href = item.permalink; 

        const contentDiv = document.createElement("div");
        contentDiv.className = "p-3";

        const title = document.createElement("h5");
        title.textContent = item.title || "Untitled"; 

        const description = document.createElement("div");
        description.textContent = item.description || "No description available"; 

        contentDiv.appendChild(title);
        contentDiv.appendChild(description);
        link.appendChild(contentDiv);
        card.appendChild(link);
        searchResultsContainer.appendChild(card);
      });
    } else {
      const noResultsMessage = document.createElement("p");
      noResultsMessage.className = "text-center py-3";
      noResultsMessage.textContent = `No results found for "${searchQuery}"`;
      searchResultsContainer.appendChild(noResultsMessage);
    }

    document.getElementById("search-content").style.display = "block";
  } else {
    document.getElementById("search-content").style.display = "none";
    document.getElementById("search-results").innerHTML = "";
  }
}