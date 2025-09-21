// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const quickExportBtn = document.getElementById('quick-export');
  const notesCountEl = document.getElementById('notes-count');
  const apiStatus = document.getElementById('api-status');

  // Load and display notes count
  function updateNotesCount() {
    chrome.runtime.sendMessage({ action: 'getNotes' }, (response) => {
      if (response && response.success) {
        const count = response.notes.length;
        notesCountEl.textContent = count;
        
        // Update button text based on notes count
        if (count > 0) {
          toggleSidebarBtn.querySelector('span').textContent = `View ${count} Notes`;
        } else {
          toggleSidebarBtn.querySelector('span').textContent = 'Open Notes';
        }
      }
    });
  }

  // Toggle sidebar
  toggleSidebarBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSidebar' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Could not establish connection:', chrome.runtime.lastError.message);
            showError('Please refresh the page and try again.');
          } else {
            window.close();
          }
        });
      }
    });
  });

  // Quick export (exports as markdown)
  quickExportBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getNotes' }, (response) => {
      if (response && response.success) {
        if (response.notes.length === 0) {
          showError('No notes to export');
          return;
        }

        chrome.runtime.sendMessage({
          action: 'exportNotes',
          data: { format: 'markdown' }
        }, (exportResponse) => {
          if (exportResponse && exportResponse.success) {
            downloadFile(exportResponse.data, 'ai-notes.md', 'markdown');
            showSuccess('Notes exported successfully!');
            setTimeout(() => window.close(), 1500);
          } else {
            showError('Export failed. Please try again.');
          }
        });
      }
    });
  });

  // Download file helper
  function downloadFile(content, filename, format) {
    const mimeTypes = {
      'markdown': 'text/markdown',
      'txt': 'text/plain',
      'json': 'application/json'
    };

    const blob = new Blob([content], { type: mimeTypes[format] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Show success message
  function showSuccess(message) {
    const statusEl = apiStatus.querySelector('span');
    const originalText = statusEl.textContent;
    statusEl.textContent = message;
    statusEl.parentElement.querySelector('.w-2').className = 'w-2 h-2 bg-green-400 rounded-full';
    
    setTimeout(() => {
      statusEl.textContent = originalText;
    }, 2000);
  }

  // Show error message
  function showError(message) {
    const statusEl = apiStatus.querySelector('span');
    const originalText = statusEl.textContent;
    statusEl.textContent = message;
    statusEl.parentElement.querySelector('.w-2').className = 'w-2 h-2 bg-red-400 rounded-full';
    
    setTimeout(() => {
      statusEl.textContent = originalText;
      statusEl.parentElement.querySelector('.w-2').className = 'w-2 h-2 bg-green-400 rounded-full';
    }, 3000);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Enter to toggle sidebar
    if (e.key === 'Enter') {
      toggleSidebarBtn.click();
    }
    
    // 'E' for export
    if (e.key.toLowerCase() === 'e') {
      quickExportBtn.click();
    }
  });

  // Initialize
  updateNotesCount();
  
  // Set OS-specific keyboard shortcut
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutHint = document.getElementById('shortcut-hint');
  if (shortcutHint) {
    const shortcutKey = isMac ? 'Cmd+Shift+N' : 'Ctrl+Shift+N';
    shortcutHint.innerHTML = `• Use <kbd class="bg-white px-1 rounded">${shortcutKey}</kbd> to toggle sidebar`;
  }
  
  console.log('AI Note-Taker popup initialized.');
});
