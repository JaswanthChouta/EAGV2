document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const resultsList = document.getElementById("results");
  const pinnedList = document.getElementById("pinned-list");
  const themeToggle = document.getElementById("theme-toggle");

  const MAX_PINNED_BOOKMARKS = 5;
  const LOCAL_STORAGE_KEY = "pinnedBookmarks";
  const THEME_LOCAL_STORAGE_KEY = "themePreference";
  /*
    // Theme management functions
    function applyTheme(theme) {
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
      } else {
        document.body.classList.remove('dark-theme');
        themeToggle.textContent = '🌙';
      }
      localStorage.setItem(THEME_LOCAL_STORAGE_KEY, theme);
    }
  
    function toggleTheme() {
      const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    }
  
    // Initialize theme
    const savedTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);
    if (savedTheme) {
      applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  
    themeToggle.addEventListener('click', toggleTheme);
    */

  // Function to save pinned bookmarks to localStorage
  function savePinnedBookmarks(pinnedBookmarks) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pinnedBookmarks));
  }

  // Function to get pinned bookmarks from localStorage
  async function getPinnedBookmarks() {
    return new Promise((resolve) => {
      const storedBookmarks = localStorage.getItem(LOCAL_STORAGE_KEY);
      resolve(storedBookmarks ? JSON.parse(storedBookmarks) : []);
    });
  }

  // Function to display pinned bookmarks
  async function displayPinnedBookmarks() {
    const pinnedBookmarks = await getPinnedBookmarks();
    pinnedList.innerHTML = "";

    if (pinnedBookmarks.length === 0) {
      const noPinnedItem = document.createElement("li");
      noPinnedItem.textContent = "No pinned bookmarks yet.";
      pinnedList.appendChild(noPinnedItem);
    } else {
      pinnedBookmarks.slice(0, MAX_PINNED_BOOKMARKS).forEach((bookmark) => {
        const listItem = createBookmarkListItem(bookmark, true);
        pinnedList.appendChild(listItem);
      });
    }
  }

  // Helper function to create a bookmark list item
  function createBookmarkListItem(bookmark, isPinned) {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = bookmark.url;
    link.textContent = bookmark.title;
    link.target = "_blank";
    listItem.appendChild(link);

    const pinButton = document.createElement("button");
    pinButton.classList.add("pin-button");
    pinButton.innerHTML = isPinned ? "&#x1f4cc;" : "&#9734;"; // Pushpin or empty star
    if (isPinned) {
      pinButton.classList.add("pinned");
    }
    pinButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      let currentPinned = await getPinnedBookmarks();
      if (isPinned) {
        // Unpin
        currentPinned = currentPinned.filter((p) => p.id !== bookmark.id);
      } else {
        // Pin
        if (currentPinned.length >= MAX_PINNED_BOOKMARKS) {
          alert(
            `You can only pin up to ${MAX_PINNED_BOOKMARKS} bookmarks. Please unpin one to pin a new one.`
          );
          return;
        }
        if (!currentPinned.some((p) => p.id === bookmark.id)) {
          currentPinned.push(bookmark);
        }
      }
      savePinnedBookmarks(currentPinned);
      displayPinnedBookmarks(); // Re-render pinned list
      searchBookmarks(searchInput.value); // Re-render search results
    });
    listItem.appendChild(pinButton);

    return listItem;
  }

  // New function to get all bookmarks by traversing the tree
  async function getAllBookmarksRecursively() {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const allBookmarks = [];
        function traverse(nodes) {
          for (const node of nodes) {
            if (node.url) {
              // It's a bookmark
              allBookmarks.push(node);
            }
            if (node.children) {
              traverse(node.children);
            }
          }
        }
        traverse(tree);
        resolve(allBookmarks);
      });
    });
  }

  async function searchBookmarks(query) {
    resultsList.innerHTML = "";
    const pinnedBookmarks = await getPinnedBookmarks();
    const pinnedIds = new Set(pinnedBookmarks.map((b) => b.id));

    let bookmarksToProcess;
    if (query.trim() === "") {
      bookmarksToProcess = await getAllBookmarksRecursively(); // Get all bookmarks if query is empty
    } else {
      // Original search logic for non-empty queries
      bookmarksToProcess = await new Promise((resolve) => {
        chrome.bookmarks.search(query, (results) => resolve(results));
      });
    }

    const unpinnedResults = bookmarksToProcess.filter(
      (bookmark) =>
        bookmark.url &&
        !pinnedIds.has(bookmark.id) &&
        (query.trim() === "" ||
          bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(query.toLowerCase()))
    );

    if (unpinnedResults.length === 0 && query.trim() !== "") {
      const noResultsItem = document.createElement("li");
      noResultsItem.textContent = "No matching unpinned bookmarks found.";
      resultsList.appendChild(noResultsItem);
    } else if (unpinnedResults.length === 0 && query.trim() === "") {
      const noResultsItem = document.createElement("li");
      noResultsItem.textContent = "No unpinned bookmarks found.";
      resultsList.appendChild(noResultsItem);
    } else {
      unpinnedResults.forEach((bookmark) => {
        const listItem = createBookmarkListItem(bookmark, false);
        resultsList.appendChild(listItem);
      });
    }
  }

  searchInput.addEventListener("input", (event) => {
    searchBookmarks(event.target.value);
  });

  // Initial display of pinned bookmarks and all unpinned bookmarks by default
  displayPinnedBookmarks();
  searchBookmarks("");
  document.body.classList.add("dark-theme");
});
