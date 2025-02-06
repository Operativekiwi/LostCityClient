const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

let plugins = [];

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadURL("https://w1-2004.lostcity.rs/rs2.cgi"); // Load the game
});

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
