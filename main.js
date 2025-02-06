const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { updatePlugins } = require(path.join(__dirname, "pluginUpdater"));

let mainWindow;
let gameView;  // ✅ Declare gameView globally
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

let plugins = [];

async function loadAllPlugins() {
  plugins = [];

  const pluginFiles = fs.readdirSync(PLUGIN_DIR).filter(file => file.endsWith(".js"));

  plugins = pluginFiles.map(file => ({
      name: file.replace(".js", ""),
      icon: "🔌" // Default icon
  }));

  console.log("Sending plugins to renderer:", plugins);

  if (mainWindow) {
      mainWindow.webContents.send("plugins-loaded", plugins);
  }
}

// ✅ Fix: Ensure the IPC handler is registered before any requests
ipcMain.handle("get-plugins", async () => plugins);

// ✅ Fix: Ensure gameView is available before calling it
ipcMain.on("changeWorld", (_, url) => {
  if (gameView) {
    console.log(`Changing game view to: ${url}`);
    gameView.webContents.loadURL(url);
  } else {
    console.error("Error: gameView is not initialized.");
  }
});

app.whenReady().then(async () => {
  await updatePlugins(); // Auto-update plugins on startup

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "Lost City Client",
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  gameView = new BrowserView({  // ✅ Assign gameView in the right place
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setBrowserView(gameView);
  gameView.setBounds({ x: 0, y: 0, width: 900, height: 720 });
  gameView.webContents.loadURL("https://w1-2004.lostcity.rs/rs2.cgi");

  const pluginPanel = new BrowserView({
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.addBrowserView(pluginPanel);
  pluginPanel.setBounds({ x: 900, y: 0, width: 380, height: 720 });
  pluginPanel.webContents.loadFile("pluginPanel.html");

  mainWindow.on("resize", () => {
    const [width, height] = mainWindow.getSize();
    gameView.setBounds({ x: 0, y: 0, width: width - 380, height });
    pluginPanel.setBounds({ x: width - 380, y: 0, width: 380, height });
  });

  loadAllPlugins(); // ✅ Load plugins properly
});
