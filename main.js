const { app, BrowserWindow } = require("electron");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false, // Prevents direct access to Node.js
      contextIsolation: true,  // Security best practice
      preload: __dirname + "/preload.js" // Preload script for plugin support
    }
  });

  mainWindow.loadURL("https://w1-2004.lostcity.rs/rs2.cgi"); // Load the game
});
