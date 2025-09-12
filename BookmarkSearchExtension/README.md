# Bookmark Search Chrome Extension

A lightweight Chrome extension that allows you to quickly search through your saved bookmarks, pin your favorite ones for quick access, and supports both light and dark themes.

## Features

*   **Bookmark Search**: Easily find bookmarks by searching their titles and URLs.
*   **Pinned Bookmarks**: Pin up to 5 of your most important bookmarks for quick access at the top of the extension popup.
*   **Persistent Pinned Bookmarks**: Pinned bookmarks are saved locally using `localStorage`, so they persist across browser sessions.
*   **Theme Support**: Toggle between light and dark themes to suit your preference, with theme preference saved locally.
*   **All Bookmarks Display**: When the search input is empty, all unpinned bookmarks are displayed, allowing for easy browsing with scrolling.
*   **Lightweight**: Designed to be simple and fast.

## Installation

To install this extension in your Chrome browser:

1.  **Clone or Download**: Download this project to your local machine.
2.  **Open Chrome Extensions Page**:
    *   Open Google Chrome.
    *   Navigate to `chrome://extensions` in your address bar, or go to "More Tools" > "Extensions" from the Chrome menu.
3.  **Enable Developer Mode**:
    *   On the top right of the extensions page, toggle on "Developer mode".
4.  **Load Unpacked Extension**:
    *   Click the "Load unpacked" button that appears.
    *   Select the directory where you saved this project (the folder containing `manifest.json`, `popup.html`, etc.).
5.  **Pin the Extension (Optional but Recommended)**:
    *   Once loaded, the extension icon (currently placeholder) should appear in your browser's toolbar. If it doesn't, click the puzzle piece icon (Extensions) in the toolbar and then the pin icon next to "Bookmark Search" to make it visible.

## Usage

1.  **Open the Extension**: Click the "Bookmark Search" icon in your Chrome toolbar.

2.  **Search Bookmarks**:
    *   The popup will display your pinned bookmarks at the top, followed by all your unpinned bookmarks.
    *   Use the search input field to type keywords. The results below will dynamically filter based on your query, searching both bookmark titles and URLs.

3.  **Pin/Unpin Bookmarks**:
    *   Next to each bookmark in the search results and the pinned list, you'll see a pin icon (&#x1f4cc; for pinned, &#9734; for unpinned).
    *   Click the &#9734; icon to pin a bookmark. It will move to the "Pinned Bookmarks" section.
    *   Click the &#x1f4cc; icon to unpin a bookmark. It will move back to the main search results.
    *   **Limit**: You can pin a maximum of 5 bookmarks. If you try to pin more, you'll receive an alert message.

4.  **Theme Toggle**:
    *   In the top right corner of the extension popup, there's a theme toggle button (&#x2600;&#xfe0f; for light mode, &#x1f319; for dark mode).
    *   Click this button to switch between light and dark themes. Your preference will be saved.

## Project Structure

.
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── icons/
├── icon16.png
├── icon48.png
└── icon128.png

*   `manifest.json`: Defines the extension's properties, permissions, and links to other files.
*   `popup.html`: The user interface of the extension, containing the search input, pinned list, and results list.
*   `popup.css`: Styles for the extension popup, including responsive design and dark/light theme support.
*   `popup.js`: The core logic for searching, pinning, theme management, and interacting with Chrome's bookmark and `localStorage` APIs.
*   `icons/`: Contains the icon images for the extension (16x16, 48x48, and 128x128 pixels). **Remember to replace the placeholder images with your actual logo files.**

---
