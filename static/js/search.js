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

async function initSearchEngine() {
  if (fuseInstance || isFetchingData) return;
  isFetchingData = true;

  try {
    let indexURL = window.searchIndexURL || '/index.json';
    let response = await fetch(indexURL);
    if (!response.ok) throw new Error("Failed to fetch search data");

    let searchJson = await response.json();
    
    const options = {
      keys: ['title', 'content'],
      includeScore: true,
      includeMatches: true, 
      threshold: 0.5,        // Relaxed threshold for typos like "youg"
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 3,
      useExtendedSearch: false
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
  initSearchEngine(); 
  debounceTimeout = setTimeout(() => performSearch(evt), 300);
}

async function performSearch(evt) {
  let searchQuery = evt.target.value.trim();

  if (searchQuery !== "") {
    const searchButtonEle = document.querySelectorAll("#search");
    if (searchButtonEle.length < 2) return;

    let searchButtonPosition;
    if (window.innerWidth > 768) {
      searchButtonPosition = searchButtonEle[0].getBoundingClientRect();
      document.getElementById("search-content").style.width = "500px";
    } else {
      searchButtonPosition = searchButtonEle[1].getBoundingClientRect();
      document.getElementById("search-content").style.width = "300px";
    }

    document.getElementById("search-content").style.top = searchButtonPosition.top + 50 + "px";
    document.getElementById("search-content").style.left = searchButtonPosition.left + "px";

    while (isFetchingData) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!fuseInstance) return; 

    const fuseResults = fuseInstance.search(searchQuery);
    const searchResultsContainer = document.getElementById("search-results");
    searchResultsContainer.innerHTML = ""; 

    if (fuseResults.length > 0) {
      fuseResults.forEach((result) => {
        const item = result.item;
        if (!item.permalink || !isValidUrl(item.permalink)) return;

        // --- BULLETPROOF SNIPPET GENERATOR ---
        // Default to the first 100 characters of the content if we can't find a specific match index
        let snippetText = item.content ? item.content.substring(0, 100) + "..." : "Match found.";

        if (result.matches && result.matches.length > 0) {
          const contentMatch = result.matches.find(m => m.key === 'content') || result.matches[0];
          
          if (contentMatch && contentMatch.value && contentMatch.indices.length > 0) {
            const text = contentMatch.value;
            const matchStart = contentMatch.indices[0][0]; 
            const pad = 60; 
            
            let start = Math.max(0, matchStart - pad);
            let end = Math.min(text.length, matchStart + searchQuery.length + pad);
            
            snippetText = (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");
          }
        }

        const safeSnippet = encodeHTML(snippetText);
        
        // Highlight the search term (exact matches only for the yellow highlighter)
        const safeQuery = encodeHTML(searchQuery);
        const regex = new RegExp(`(${safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const highlightedSnippet = safeSnippet.replace(regex, '<mark style="background-color: #ffeb3b; padding: 0 2px;">$1</mark>');
        // ------------------------------------

        const card = document.createElement("div");
        card.className = "card border-bottom py-2"; 

        const link = document.createElement("a");
        link.href = item.permalink; 
        link.style.textDecoration = "none";
        link.style.color = "inherit";

        const contentDiv = document.createElement("div");
        contentDiv.className = "p-2";

        const title = document.createElement("h6");
        title.className = "mb-1 text-primary";
        title.textContent = item.title || "Untitled"; 

        const description = document.createElement("div");
        description.style.fontSize = "0.85rem"; 
        description.style.color = "#6c757d";
        description.innerHTML = highlightedSnippet; 

        contentDiv.appendChild(title);
        contentDiv.appendChild(description);
        link.appendChild(contentDiv);
        card.appendChild(link);
        searchResultsContainer.appendChild(card);
      });
    } else {
      const noResultsMessage = document.createElement("p");
      noResultsMessage.className = "text-center py-3 text-muted";
      noResultsMessage.textContent = `No results found for "${searchQuery}"`;
      searchResultsContainer.appendChild(noResultsMessage);
    }

    document.getElementById("search-content").style.display = "block";
  } else {
    document.getElementById("search-content").style.display = "none";
    document.getElementById("search-results").innerHTML = "";
  }
}