// content.js

let floatingButton;
let sidebarIframe;
let isSidebarOpen = false;
let selectedText = '';

// --- 1. Floating Button for Text Selection --- //

function createFloatingButton() {
  if (floatingButton) return;
  
  floatingButton = document.createElement('button');
  floatingButton.id = 'ai-note-taker-button';
  floatingButton.innerHTML = '➕ Add to Notes';
  floatingButton.className = 'ai-note-button';
  
  // Apply styles directly to avoid conflicts
  Object.assign(floatingButton.style, {
    position: 'absolute',
    zIndex: '10000',
    display: 'none',
    padding: '8px 16px',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  });

  floatingButton.addEventListener('mouseenter', () => {
    floatingButton.style.backgroundColor = '#3730A3';
    floatingButton.style.transform = 'translateY(-1px)';
  });

  floatingButton.addEventListener('mouseleave', () => {
    floatingButton.style.backgroundColor = '#4F46E5';
    floatingButton.style.transform = 'translateY(0)';
  });

  floatingButton.addEventListener('click', handleAddNoteClick);
  document.body.appendChild(floatingButton);
}

// Handle text selection
document.addEventListener('mouseup', (e) => {
  // Small delay to ensure selection is registered
  setTimeout(() => {
    const selection = window.getSelection();
    selectedText = selection.toString().trim();
    
    if (selectedText.length > 10) { // Minimum text length
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showFloatingButton(rect);
    } else {
      hideFloatingButton();
    }
  }, 10);
});

// Hide button when clicking elsewhere
document.addEventListener('mousedown', (e) => {
  if (e.target !== floatingButton) {
    hideFloatingButton();
  }
});

function showFloatingButton(rect) {
  if (!floatingButton) createFloatingButton();
  
  const buttonWidth = 140;
  const buttonHeight = 36;
  const margin = 8;
  
  // Calculate position
  let top = window.scrollY + rect.bottom + margin;
  let left = window.scrollX + rect.left + (rect.width / 2) - (buttonWidth / 2);
  
  // Keep button within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (left < margin) left = margin;
  if (left + buttonWidth > viewportWidth - margin) {
    left = viewportWidth - buttonWidth - margin;
  }
  
  if (top + buttonHeight > window.scrollY + viewportHeight - margin) {
    top = window.scrollY + rect.top - buttonHeight - margin;
  }
  
  floatingButton.style.top = `${top}px`;
  floatingButton.style.left = `${left}px`;
  floatingButton.style.display = 'block';
  floatingButton.style.opacity = '0';
  floatingButton.style.transform = 'translateY(10px)';
  
  // Animate in
  requestAnimationFrame(() => {
    floatingButton.style.opacity = '1';
    floatingButton.style.transform = 'translateY(0)';
  });
}

function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.style.display = 'none';
  }
}

function handleAddNoteClick() {
  if (!selectedText) return;
  
  // Show loading state
  const originalText = floatingButton.innerHTML;
  floatingButton.innerHTML = '⏳ Saving...';
  floatingButton.style.pointerEvents = 'none';
  
  console.log('Adding note:', selectedText);
  
  chrome.runtime.sendMessage({
    action: 'addNote',
    data: {
      text: selectedText,
      url: window.location.href,
      title: document.title
    }
  }, (response) => {
    // Reset button
    floatingButton.innerHTML = originalText;
    floatingButton.style.pointerEvents = 'auto';
    
    if (response && response.success) {
      console.log('Note saved successfully (without summary).');
      
      // Show success feedback
      floatingButton.innerHTML = '✅ Saved!';
      floatingButton.style.backgroundColor = '#059669';
      
      setTimeout(() => {
        hideFloatingButton();
        floatingButton.innerHTML = originalText;
        floatingButton.style.backgroundColor = '#4F46E5';
      }, 1500);
      
      // Open sidebar if not already open
      if (!isSidebarOpen) {
        toggleSidebar();
      }
    } else {
      // Show error feedback
      floatingButton.innerHTML = '❌ Error';
      floatingButton.style.backgroundColor = '#DC2626';
      
      setTimeout(() => {
        hideFloatingButton();
        floatingButton.innerHTML = originalText;
        floatingButton.style.backgroundColor = '#4F46E5';
      }, 2000);
    }
  });
  
  // Clear selection
  window.getSelection().removeAllRanges();
}

// --- 2. Sidebar Management --- //

function createSidebar() {
  if (sidebarIframe) return;
  
  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'ai-note-taker-sidebar';
  sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
  
  Object.assign(sidebarIframe.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '380px',
    height: '100vh',
    border: 'none',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
    zIndex: '9999',
    backgroundColor: 'white',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderLeft: '1px solid #E5E7EB'
  });
  
  document.body.appendChild(sidebarIframe);
  
  // Adjust body margin when sidebar is open
  const originalBodyMargin = document.body.style.marginRight;
  
  sidebarIframe.addEventListener('transitionend', () => {
    if (isSidebarOpen) {
      document.body.style.marginRight = '380px';
      document.body.style.transition = 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      document.body.style.marginRight = originalBodyMargin;
    }
  });
}

function toggleSidebar() {
  if (!sidebarIframe) createSidebar();
  
  isSidebarOpen = !isSidebarOpen;
  
  if (isSidebarOpen) {
    sidebarIframe.style.transform = 'translateX(0)';
    // Add overlay for mobile
    if (window.innerWidth < 768) {
      createOverlay();
    }
  } else {
    sidebarIframe.style.transform = 'translateX(100%)';
    removeOverlay();
    document.body.style.marginRight = '';
  }
}

function createOverlay() {
  if (document.getElementById('ai-note-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'ai-note-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: '9998',
    opacity: '0',
    transition: 'opacity 0.3s ease'
  });
  
  overlay.addEventListener('click', toggleSidebar);
  document.body.appendChild(overlay);
  
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });
}

function removeOverlay() {
  const overlay = document.getElementById('ai-note-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }
}

// --- 3. Message Handling --- //

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSidebar') {
    toggleSidebar();
    sendResponse({ success: true, isOpen: isSidebarOpen });
  }
  
  if (request.action === 'closeSidebar') {
    if (isSidebarOpen) {
      toggleSidebar();
    }
    sendResponse({ success: true });
  }
});

// --- 4. Keyboard Shortcuts --- //

document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + N to toggle sidebar
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    toggleSidebar();
  }
  
  // Escape to close sidebar
  if (e.key === 'Escape' && isSidebarOpen) {
    toggleSidebar();
  }
});

// --- 5. Initialize --- //

// Create components when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function initialize() {
  createFloatingButton();
  createSidebar();
  console.log('AI Note-Taker content script initialized.');
}

// Handle page navigation (for SPAs)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    hideFloatingButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
