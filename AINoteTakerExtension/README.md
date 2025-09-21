# AI Note-Taker Chrome Extension

A powerful Chrome extension that allows you to highlight text on any webpage and generate AI-powered structured notes using Google's Gemini API. Perfect for research, studying, and content curation.

## 🚀 Features

### Core Functionality
- **Smart Text Highlighting**: Select any text on a webpage to see a floating action button
- **AI-Powered Summaries**: Generate structured notes using Google's Gemini API
- **Collapsible Sidebar**: Modern, responsive interface that doesn't interfere with browsing
- **Persistent Storage**: All your notes are saved locally using Chrome's storage API
- **Search & Filter**: Quickly find specific notes with built-in search functionality
- **Multiple Export Formats**: Export your notes as Markdown, JSON, or TXT files

### User Experience
- **Keyboard Shortcuts**: Toggle sidebar with `Ctrl+Shift+N` (or `Cmd+Shift+N` on Mac)
- **Copy to Clipboard**: One-click copying of notes and summaries
- **Responsive Design**: Works seamlessly on all screen sizes
- **Smooth Animations**: Polished UI with visual feedback
- **Error Handling**: Graceful fallbacks when API is unavailable

## 📋 Prerequisites

- Google Chrome browser
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🛠️ Installation

### Step 1: Get Your Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the generated key

### Step 2: Configure the Extension
1. Clone or download this repository
2. Open `background.js` in a text editor
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:
   ```javascript
   const GEMINI_API_KEY = 'your-actual-api-key-here';
   ```

### Step 3: Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the extension folder
5. The AI Note-Taker extension should now appear in your extensions list

## 📖 Usage

### Taking Notes
1. **Highlight Text**: Select any text on a webpage
2. **Click the Button**: A floating button will appear - click it
3. **AI Processing**: The extension will generate a structured summary
4. **View in Sidebar**: Your note appears in the collapsible sidebar

### Managing Notes
- **Toggle Sidebar**: Use `Ctrl+Shift+N` or click the extension icon
- **Search Notes**: Use the search bar to find specific content
- **Copy Notes**: Click the copy button to copy to clipboard
- **Export Notes**: Choose from Markdown, JSON, or TXT formats
- **Delete Notes**: Remove individual notes or clear all

### Extension Popup
- Access quick settings and statistics
- View recent notes
- Toggle extension features

## 🏗️ Project Structure

```
AINoteTakerExtension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker with API integration
├── content.js            # Content script for text highlighting
├── content.css           # Styles for content script elements
├── sidebar.html          # Main sidebar interface
├── sidebar.css           # Sidebar styling with TailwindCSS
├── sidebar.js            # Sidebar functionality and note management
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Uses the latest Chrome extension standards
- **Service Worker**: Background processing for API calls
- **Content Scripts**: Injected into web pages for text selection
- **Storage API**: Persistent local storage for notes
- **Modular Design**: Clean separation of concerns

### API Integration
- **Google Gemini API**: Real AI-powered text analysis
- **Fallback System**: Mock summaries when API is unavailable
- **Error Handling**: Graceful degradation for network issues
- **Rate Limiting**: Respectful API usage patterns

### Styling
- **TailwindCSS**: Modern, responsive design system
- **Custom CSS**: Optimized for web page integration
- **Dark/Light Themes**: Adapts to user preferences
- **Mobile Support**: Responsive across all devices

## 🎨 Customization

### Styling
Modify `sidebar.css` and `content.css` to customize the appearance:
- Change color schemes
- Adjust sizing and spacing
- Modify animations and transitions

### API Configuration
Update `background.js` to:
- Change AI model parameters
- Modify prompt templates
- Adjust API timeout settings

### Keyboard Shortcuts
Edit the keyboard shortcut in `content.js`:
```javascript
// Current: Ctrl+Shift+N
if (e.ctrlKey && e.shiftKey && e.key === 'N') {
    // Change 'N' to your preferred key
}
```

## 🐛 Troubleshooting

### Common Issues

**Extension not working:**
- Ensure Developer mode is enabled
- Check that all files are in the correct directory
- Reload the extension after making changes

**API errors:**
- Verify your Gemini API key is correct
- Check your internet connection
- Ensure you haven't exceeded API quotas

**Notes not saving:**
- Check Chrome storage permissions
- Clear extension data and try again
- Ensure sufficient storage space

### Debug Mode
Enable console logging by setting debug mode in `background.js`:
```javascript
const DEBUG_MODE = true;
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## 🔄 Version History

- **v1.0**: Initial release with core functionality
  - Text highlighting and AI summarization
  - Sidebar interface with search and export
  - Gemini API integration
  - Persistent storage and keyboard shortcuts

---

**Made with ❤️ for better web browsing and note-taking**
