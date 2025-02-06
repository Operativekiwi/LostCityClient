const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { updatePlugins } = require(path.join(__dirname, "pluginUpdater"));

let mainWindow;
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

let plugins = [];

async function loadAllPlugins() {
  const pluginFiles = fs.readdirSync(PLUGIN_DIR).filter(file => file.endsWith(".js"));

  pluginFiles.forEach(file => {
    const pluginPath = path.join(PLUGIN_DIR, file);
    
    try {
      const pluginModule = require(pluginPath);
      if (pluginModule && typeof pluginModule === "function") {
        const plugin = pluginModule();
        plugins.push(plugin);
      }
    } catch (error) {
      console.error(`Error loading plugin ${file}:`, error);
    }
  });
}

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

  // Create the game view (Center)
  const gameView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setBrowserView(gameView);
  gameView.setBounds({ x: 0, y: 0, width: 900, height: 720 });
  gameView.webContents.loadURL("https://w1-2004.lostcity.rs/rs2.cgi");

  // Create the plugin panel (Right Side)
  const pluginPanel = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
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

  loadAllPlugins(); // Load all plugins after update
});

// IPC Handlers for plugin updates
ipcMain.handle("get-plugins", () => plugins);
ipcMain.handle("load-plugin", async (_, name) => {
  const pluginModule = require(pluginPath);
  if (typeof pluginModule === "function") {
      const plugin = pluginModule();
      plugins.push(plugin);
  } else {
      console.error(`Invalid plugin structure in ${file}`);
  }
    return { success: true, name: plugin.name };
});
