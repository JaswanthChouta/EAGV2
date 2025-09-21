// sidebar.js - Main logic for the sidebar interface

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const notesList = document.getElementById('notes-list');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const noteCardTemplate = document.getElementById('note-card-template');
  const notesCount = document.getElementById('notes-count');
  const searchInput = document.getElementById('search-input');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  const exportMarkdownBtn = document.getElementById('export-markdown');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const exportModal = document.getElementById('export-modal');
  const cancelExportBtn = document.getElementById('cancel-export');
  const apiStatus = document.getElementById('api-status');

  let allNotes = [];
  let filteredNotes = [];

  // --- 1. Note Rendering --- //

  function renderNotes(notes) {
    allNotes = notes;
    filteredNotes = notes;
    
    // Update notes count
    updateNotesCount(notes.length);
    
    // Clear current notes
    const existingNotes = notesList.querySelectorAll('.note-card');
    existingNotes.forEach(note => note.remove());

    if (notes.length === 0) {
      showEmptyState();
    } else {
      hideEmptyState();
      notes.forEach((note, index) => {
        const card = createNoteCard(note, index === 0);
        notesList.appendChild(card);
      });
    }
  }

  function createNoteCard(note) {
    const template = document.getElementById('note-card-template');
    const noteCard = template.content.cloneNode(true);
    
    // Set note data
    noteCard.querySelector('.note-date').textContent = new Date(note.timestamp).toLocaleDateString();
    noteCard.querySelector('.note-time').textContent = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    noteCard.querySelector('.summary-title').textContent = note.title || 'Untitled Note';
    noteCard.querySelector('.original-text-content').textContent = note.text;
    noteCard.querySelector('.citation-link').href = note.url;
    noteCard.querySelector('.citation-link').textContent = note.title;
    
    // Set note ID for actions
    const cardElement = noteCard.querySelector('.note-card');
    cardElement.dataset.noteId = note.id;
    
    // No individual summary handling - only overall summary now

    // Event listeners
    setupNoteCardEvents(noteCard, note);

    return noteCard;
  }

  function setupNoteCardEvents(noteCard, note) {
    // Delete button
    const deleteBtn = noteCard.querySelector('.delete-note-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(note.id, noteCard.querySelector('.note-card'));
    });

    // Copy button
    const copyBtn = noteCard.querySelector('.copy-note-btn');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyNoteToClipboard(note, copyBtn);
    });

  }

  // --- 2. Note Management --- //

  function generateOverallSummary() {
    const generateBtn = document.getElementById('generate-overall-summary');
    const loadingDiv = document.getElementById('summary-loading');
    const contentDiv = document.getElementById('summary-content');
    const noSummaryDiv = document.getElementById('no-summary');
    const summaryText = document.getElementById('summary-text');
    
    // Show loading state
    generateBtn.style.display = 'none';
    noSummaryDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    
    // Get all notes first
    chrome.storage.local.get(['notes'], (result) => {
      const notes = result.notes || [];
      
      if (notes.length === 0) {
        // No notes to summarize
        loadingDiv.classList.add('hidden');
        generateBtn.style.display = 'flex';
        noSummaryDiv.classList.remove('hidden');
        showNotification('❌ No notes to summarize. Add some notes first!', 'error');
        return;
      }
      
      // Check if API key is available
      chrome.storage.local.get(['geminiApiKey'], (keyResult) => {
        let apiKey = keyResult.geminiApiKey;
        
        if (!apiKey) {
          // Prompt user for API key
          apiKey = prompt('Please enter your Gemini API key to generate AI summary:\n\n(Get your free API key from: https://aistudio.google.com/app/apikey)');
          
          if (!apiKey) {
            // User cancelled
            loadingDiv.classList.add('hidden');
            generateBtn.style.display = 'flex';
            noSummaryDiv.classList.remove('hidden');
            return;
          }
          
          // Save API key for future use
          chrome.storage.local.set({ geminiApiKey: apiKey });
        }
        
        // Prepare notes text for summarization
        const notesText = notes.map(note => `${note.title}: ${note.text}`).join('\n\n');
        
        // Send to background script for API call
        chrome.runtime.sendMessage({
          action: 'generateOverallSummary',
          notesText: notesText,
          apiKey: apiKey
        }, (response) => {
          loadingDiv.classList.add('hidden');
          
          if (response && response.success) {
            // Show summary
            contentDiv.classList.remove('hidden');
            summaryText.textContent = response.summary;
            
            // Show regenerate button and hide generate button
            generateBtn.style.display = 'none';
            const regenerateBtn = document.getElementById('regenerate-summary');
            if (regenerateBtn) {
              regenerateBtn.classList.remove('hidden');
            }
            
            showNotification('✅ Overall summary generated successfully!', 'success');
          } else {
            // Show error and restore generate button
            generateBtn.style.display = 'flex';
            noSummaryDiv.classList.remove('hidden');
            
            if (response && response.error === 'INVALID_API_KEY') {
              // Clear stored API key and ask again
              chrome.storage.local.remove(['geminiApiKey']);
              showNotification('❌ Invalid API key. Please try again with a valid key.', 'error');
            } else {
              showNotification('❌ Failed to generate summary. Please try again.', 'error');
            }
          }
        });
      });
    });
  }

  function deleteNote(noteId, noteCardElement) {
    // Add confirmation
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    // Animate out
    if (noteCardElement) {
      noteCardElement.style.opacity = '0';
      noteCardElement.style.transform = 'translateX(100%)';
    }
    
    setTimeout(() => {
      chrome.runtime.sendMessage({ 
        action: 'deleteNote', 
        data: { noteId: noteId } 
      }, (response) => {
        if (response && response.success) {
          if (noteCardElement) {
            noteCardElement.remove();
          }
          loadNotes(); // Reload all notes to refresh the display
        }
      });
    }, 200);
  }

  function copyNoteToClipboard(note, copyBtn) {
    let noteText = `${note.title || 'Untitled Note'}\n\n`;
    noteText += `Text: ${note.text}\n\n`;
    noteText += `Source: ${note.title} (${note.url})\n`;
    noteText += `Date: ${new Date(note.timestamp).toLocaleString()}`;
    
    // Use fallback method for clipboard access in iframe
    const textArea = document.createElement('textarea');
    textArea.value = noteText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showNotification('✅ Note copied to clipboard!', 'success');
        
        // Visual feedback on button
        if (copyBtn) {
          const originalIcon = copyBtn.innerHTML;
          copyBtn.innerHTML = `
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          `;
          
          setTimeout(() => {
            copyBtn.innerHTML = originalIcon;
          }, 1500);
        }
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      document.body.removeChild(textArea);
      console.error('Copy failed:', err);
      showNotification('❌ Copy failed. Please select and copy manually.', 'error');
    }
  }

  // --- 3. Search Functionality Removed --- //
  // Search functionality has been removed for better UX 

  // --- 4. Export Functionality --- //

  function showExportModal() {
    exportModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function hideExportModal() {
    exportModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  function exportNotes(format) {
    if (allNotes.length === 0) {
      showNotification('No notes to export', 'warning');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'exportNotes',
      data: { format: format }
    }, (response) => {
      if (response && response.success) {
        downloadFile(response.data, `ai-notes.${format}`, format);
        hideExportModal();
        showNotification(`Notes exported as ${format.toUpperCase()}`, 'success');
      } else {
        showNotification('Export failed. Please try again.', 'error');
      }
    });
  }

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

  // --- 5. UI State Management --- //

  function showEmptyState() {
    emptyState.style.display = 'block';
    loadingState.style.display = 'none';
  }

  function hideEmptyState() {
    emptyState.style.display = 'none';
    loadingState.style.display = 'none';
  }

  function showLoadingState() {
    emptyState.style.display = 'none';
    loadingState.style.display = 'block';
  }

  function updateNotesCount(count) {
    notesCount.textContent = `${count} note${count !== 1 ? 's' : ''}`;
  }

  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 transition-all duration-300 transform translate-x-full`;
    
    const colors = {
      'success': 'bg-green-500 text-white',
      'error': 'bg-red-500 text-white',
      'warning': 'bg-yellow-500 text-black',
      'info': 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // --- 6. Event Listeners --- //

  // Close sidebar
  closeSidebarBtn.addEventListener('click', () => {
    // Send message to content script to close sidebar
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'closeSidebar' });
      }
    });
  });

  // Generate overall summary button
  const generateOverallSummaryBtn = document.getElementById('generate-overall-summary');
  if (generateOverallSummaryBtn) {
    generateOverallSummaryBtn.addEventListener('click', generateOverallSummary);
  }

  // Regenerate summary button
  const regenerateSummaryBtn = document.getElementById('regenerate-summary');
  if (regenerateSummaryBtn) {
    regenerateSummaryBtn.addEventListener('click', generateOverallSummary);
  }

  // Toggle summary section
  const toggleSummaryBtn = document.getElementById('toggle-summary-section');
  const summaryContent = document.getElementById('summary-section-content');
  const summaryChevron = document.getElementById('summary-chevron');
  
  if (toggleSummaryBtn && summaryContent && summaryChevron) {
    toggleSummaryBtn.addEventListener('click', () => {
      const isCollapsed = summaryContent.classList.contains('collapsed');
      
      if (isCollapsed) {
        summaryContent.classList.remove('collapsed');
        summaryChevron.style.transform = 'rotate(0deg)';
      } else {
        summaryContent.classList.add('collapsed');
        summaryChevron.style.transform = 'rotate(-90deg)';
      }
    });
  }

  // Export buttons
  exportMarkdownBtn.addEventListener('click', showExportModal);

  // Export modal
  cancelExportBtn.addEventListener('click', hideExportModal);
  
  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) {
      hideExportModal();
    }
  });

  // Export format selection
  document.querySelectorAll('.export-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      exportNotes(format);
    });
  });

  // Clear all notes
  clearAllBtn.addEventListener('click', () => {
    if (allNotes.length === 0) {
      showNotification('No notes to clear', 'warning');
      return;
    }

    if (confirm(`Are you sure you want to delete all ${allNotes.length} notes? This action cannot be undone.`)) {
      chrome.runtime.sendMessage({ action: 'clearAllNotes' }, (response) => {
        if (response && response.success) {
          renderNotes([]);
          showNotification('All notes cleared', 'success');
        }
      });
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape') {
      if (!exportModal.classList.contains('hidden')) {
        hideExportModal();
      }
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // --- 7. Message Handling --- //

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'notesUpdated') {
      renderNotes(request.data);
    }
  });

  // --- 8. Initialize --- //

  function initialize() {
    showLoadingState();
    
    // Load existing notes
    chrome.runtime.sendMessage({ action: 'getNotes' }, (response) => {
      if (response && response.success) {
        renderNotes(response.notes);
      } else {
        hideEmptyState();
        showNotification('Failed to load notes', 'error');
      }
    });

    // Update API status
    updateAPIStatus();
  }

  function updateAPIStatus() {
    // This could be enhanced to check actual API status
    apiStatus.innerHTML = `
      <span class="text-gray-400">Powered by </span>
      <span class="text-indigo-500 font-medium">Gemini AI</span>
    `;
  }

  // Start the application
  initialize();

  console.log('AI Note-Taker sidebar initialized.');
});
