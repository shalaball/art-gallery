const { app, BrowserWindow } = require('electron');
const http = require('http');
const path = require('path');

// Ensure git and node are findable in PATH when launched as a packaged .app
process.env.PATH = [
  '/usr/local/bin',
  '/opt/homebrew/bin',
  '/usr/bin',
  '/bin',
  process.env.PATH
].join(':');

// When packaged, __dirname is inside the .app bundle (Contents/Resources/app/).
// Point server.js at the actual art-gallery folder (4 levels up from __dirname).
if (app.isPackaged) {
  process.env.GALLERY_DIR = path.resolve(__dirname, '../../../..');
}

// Start the Express server
require('./server.js');

function waitForServer() {
  return new Promise((resolve) => {
    const try_ = () => {
      http.get('http://localhost:3000', () => resolve())
          .on('error', () => setTimeout(try_, 200));
    };
    try_();
  });
}

let mainWindow;

app.whenReady().then(async () => {
  await waitForServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'Art Gallery Admin',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://localhost:3000');
  mainWindow.on('closed', () => { mainWindow = null; });
});

app.on('window-all-closed', () => app.quit());
