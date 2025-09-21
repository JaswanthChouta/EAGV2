// background.js

// Configuration - User will need to set their API key
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // User needs to replace this

// Function to generate AI summary using Gemini API
async function generateAISummary(text) {
  const API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // Replace with your actual API key
  
  if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('Gemini API key not configured. Using mock summary.');
    return generateMockSummary(text);
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please analyze the following text and provide a structured summary with key points:\n\n"${text}"\n\nFormat your response as a JSON object with a "title" field and a "points" array containing the main insights.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    try {
      // Try to parse as JSON first
      const parsedSummary = JSON.parse(generatedText);
      return parsedSummary;
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      return {
        title: "AI-Generated Summary",
        points: [generatedText]
      };
    }
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return generateMockSummary(text);
  }
}

// Function to generate overall AI summary for all notes
async function generateOverallAISummary(notesText, apiKey) {
  if (!apiKey) {
    throw new Error('API key required');
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please analyze all the following notes and provide a comprehensive summary that identifies key themes, insights, and patterns across all the content:\n\n${notesText}\n\nProvide a clear, well-structured summary that captures the main ideas and connections between the different notes.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API_KEY_INVALID');
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    return generatedText;
    
  } catch (error) {
    console.error('Error calling Gemini API for overall summary:', error);
    throw error;
    console.error('Gemini API call failed:', error);
    // Fallback to mock data on error
    return getMockSummary(text);
  }
}

// Mock summary function for fallback
function getMockSummary(text) {
  return {
    title: "AI-Generated Summary",
    points: [
      "Key insight extracted from the highlighted text",
      "Important information identified by AI analysis",
      "Structured summary for easy reference",
      `Text length: ${text.length} characters`
    ]
  };
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addNote") {
    const { text, url, title } = request.data;
    
    const newNote = {
      id: `note_${Date.now()}`,
      text: text,
      title: title,
      url: url,
      timestamp: Date.now(),
      hasSummary: false
    };

    // Save the new note to storage without generating summary
    chrome.storage.local.get({ notes: [] }, (result) => {
      const notes = [newNote, ...result.notes];
      chrome.storage.local.set({ notes: notes }, () => {
        console.log("Note saved successfully (without summary).");
        // Notify all tabs about the update
        chrome.runtime.sendMessage({ 
          action: "notesUpdated", 
          data: notes 
        }).catch(() => {
          // Ignore errors if no listeners
        });
        sendResponse({ success: true, notes: notes, newNote: newNote });
      });
    });
    return true; // Indicates async response
  }

  // Generate overall summary for all notes
  if (request.action === 'generateOverallSummary') {
    const { notesText, apiKey } = request;
    
    if (!apiKey) {
      sendResponse({ success: false, error: 'API key required' });
      return;
    }
    
    (async () => {
      try {
        const summary = await generateOverallAISummary(notesText, apiKey);
        sendResponse({ success: true, summary });
      } catch (error) {
        console.error('Error generating overall summary:', error);
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
          sendResponse({ success: false, error: 'INVALID_API_KEY' });
        } else {
          sendResponse({ success: false, error: error.message });
        }
      }
    })();
    
    return true; // Keep message channel open for async response
  }

  if (request.action === "generateSummary") {
    (async () => {
      try {
        const { noteId } = request.data;
        
        // Get the note
        chrome.storage.local.get({ notes: [] }, async (result) => {
          const notes = result.notes;
          const noteIndex = notes.findIndex(note => note.id === noteId);
          
          if (noteIndex === -1) {
            sendResponse({ success: false, error: "Note not found" });
            return;
          }
          
          const note = notes[noteIndex];
          
          // Generate summary
          const summary = await callGeminiAPI(note.originalText, note.citation.title, note.citation.url);
          
          // Update note with summary
          notes[noteIndex] = {
            ...note,
            summary: summary,
            hasSummary: true
          };
          
          // Save updated notes
          chrome.storage.local.set({ notes: notes }, () => {
            console.log("Summary generated and note updated.");
            chrome.runtime.sendMessage({ 
              action: "notesUpdated", 
              data: notes 
            }).catch(() => {
              // Ignore errors if no listeners
            });
            sendResponse({ success: true, notes: notes, updatedNote: notes[noteIndex] });
          });
        });
      } catch (error) {
        console.error('Error generating summary:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates async response
  }

  if (request.action === "deleteNote") {
    chrome.storage.local.get({ notes: [] }, (result) => {
      const notes = result.notes.filter(note => note.id !== request.data.noteId);
      chrome.storage.local.set({ notes: notes }, () => {
        console.log("Note deleted successfully.");
        chrome.runtime.sendMessage({ 
          action: "notesUpdated", 
          data: notes 
        }).catch(() => {
          // Ignore errors if no listeners
        });
        sendResponse({ success: true, notes: notes });
      });
    });
    return true;
  }

  if (request.action === "clearAllNotes") {
    chrome.storage.local.set({ notes: [] }, () => {
      console.log("All notes cleared.");
      chrome.runtime.sendMessage({ 
        action: "notesUpdated", 
        data: [] 
      }).catch(() => {
        // Ignore errors if no listeners
      });
      sendResponse({ success: true, notes: [] });
    });
    return true;
  }

  if (request.action === "getNotes") {
    chrome.storage.local.get({ notes: [] }, (result) => {
      sendResponse({ success: true, notes: result.notes });
    });
    return true;
  }

  if (request.action === "exportNotes") {
    chrome.storage.local.get({ notes: [] }, (result) => {
      const exportData = generateExportData(result.notes, request.data.format);
      sendResponse({ success: true, data: exportData });
    });
    return true;
  }
});

// Generate export data in different formats
function generateExportData(notes, format) {
  const timestamp = new Date().toLocaleDateString();
  
  switch (format) {
    case 'markdown':
      return generateMarkdown(notes, timestamp);
    case 'json':
      return JSON.stringify(notes, null, 2);
    case 'txt':
      return generatePlainText(notes, timestamp);
    default:
      return generateMarkdown(notes, timestamp);
  }
}

function generateMarkdown(notes, timestamp) {
  let markdown = `# AI Note-Taker Export\n\nExported on: ${timestamp}\nTotal Notes: ${notes.length}\n\n---\n\n`;
  
  notes.forEach((note, index) => {
    markdown += `## Note ${index + 1}\n\n`;
    markdown += `**Date:** ${new Date(note.timestamp).toLocaleDateString()}\n\n`;
    markdown += `**Text:**\n> ${note.text}\n\n`;
    markdown += `**Source:** [${note.title}](${note.url})\n\n`;
    markdown += `---\n\n`;
  });
  
  return markdown;
}

function generatePlainText(notes, timestamp) {
  let text = `AI Note-Taker Export\n\nExported on: ${timestamp}\nTotal Notes: ${notes.length}\n\n`;
  
  notes.forEach((note, index) => {
    text += `Note ${index + 1}\n`;
    text += `Date: ${new Date(note.timestamp).toLocaleDateString()}\n`;
    text += `Text: ${note.text}\n`;
    text += `Source: ${note.title} (${note.url})\n\n`;
    text += `${'='.repeat(50)}\n\n`;
  });
  
  return text;
}

console.log("AI Note-Taker background script loaded with Gemini API integration.");
