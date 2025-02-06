const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

let plugins = [];

// Create the Electron Window
app.whenReady().then(() => {
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
  gameView.setBounds({ x: 0, y: 0, width: 900, height: 720 }); // Game takes left 900px
  gameView.webContents.loadURL("https://w1-2004.lostcity.rs/rs2.cgi");

  // Create the plugin panel (Right Side)
  const pluginPanel = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Plugins need node access
    }
  });

  mainWindow.addBrowserView(pluginPanel);
  pluginPanel.setBounds({ x: 900, y: 0, width: 380, height: 720 }); // Sidebar 380px
  pluginPanel.webContents.loadFile("pluginPanel.html"); // Load plugin panel UI

  // Resize views when window resizes
  mainWindow.on("resize", () => {
    const [width, height] = mainWindow.getSize();
    gameView.setBounds({ x: 0, y: 0, width: width - 380, height });
    pluginPanel.setBounds({ x: width - 380, y: 0, width: 380, height });
  });

  console.log("Main window loaded with game and plugin panel.");
});

// Handle Plugin Management
ipcMain.handle("get-plugins", () => plugins);
ipcMain.handle("load-plugin", async (_, name) => {
  const pluginPath = path.join(PLUGIN_DIR, `${name}.js`);
  if (!fs.existsSync(pluginPath)) return { success: false, error: "Plugin not found" };

  const pluginModule = require(pluginPath);
  if (!pluginModule || !pluginModule.default) return { success: false, error: "Invalid plugin structure" };

  const plugin = pluginModule.default();
  plugins.push(plugin);
  return { success: true, name: plugin.name };
});

// Close the application when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
