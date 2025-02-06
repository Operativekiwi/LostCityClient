const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { updatePlugins } = require(path.join(__dirname, "pluginUpdater"));

let mainWindow;
let gameView;
let pluginPanel;
let bottomPluginPanel;
let bottomPanelEnabled = false;
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
    fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

let plugins = [];
let activePlugins = { right: [], bottom: [] };

async function loadAllPlugins() {
    plugins = [];

    let pluginMetadata = {};
    try {
        const pluginData = fs.readFileSync(path.join(PLUGIN_DIR, "plugins.json"), "utf8");
        const parsedData = JSON.parse(pluginData);
        pluginMetadata = parsedData.plugins.reduce((acc, p) => {
            acc[p.name] = p.icon || "🔌";
            return acc;
        }, {});

        plugins = parsedData.plugins.map(({ name }) => ({
            name,
            icon: pluginMetadata[name] || "🔌"
        }));

        console.log("✅ Plugins loaded successfully:", plugins);
    } catch (error) {
        console.error("❌ Error loading plugins.json:", error);
    }

    if (mainWindow) {
        console.log("✅ Sending plugins to renderer:", { plugins, activePlugins });
        mainWindow.webContents.send("plugins-loaded", { plugins, activePlugins });
    }
}

// ✅ Re-added IPC handler for fetching plugins
ipcMain.handle("get-plugins", async () => {
    console.log("✅ get-plugins called, returning plugins...");
    return { plugins, activePlugins };
});

// ✅ IPC handler to toggle bottom panel
ipcMain.on("toggle-bottom-panel", (_, enabled) => {
  console.log("✅ Received toggle-bottom-panel:", enabled);

  bottomPanelEnabled = enabled;

  if (bottomPluginPanel) {
      const height = enabled ? 200 : 0;
      console.log(`✅ Setting bottom panel height: ${height}`);

      bottomPluginPanel.setBounds({ x: 0, y: 720 - height, width: 1280, height });
      bottomPluginPanel.setAutoResize({ width: true, height: enabled });

      bottomPluginPanel.webContents.send("bottom-panel-visibility", enabled);
  }

  mainWindow.webContents.send("bottom-panel-visibility", enabled);
});

// ✅ IPC handler to update active plugin locations
ipcMain.on("move-plugin", (_, { plugin, targetPanel }) => {
    console.log(`✅ Moving plugin '${plugin}' to ${targetPanel} panel`);

    if (targetPanel === "right") {
        activePlugins.bottom = activePlugins.bottom.filter(p => p !== plugin);
        activePlugins.right.push(plugin);
    } else if (targetPanel === "bottom") {
        activePlugins.right = activePlugins.right.filter(p => p !== plugin);
        activePlugins.bottom.push(plugin);
    }

    console.log("✅ Updated activePlugins:", activePlugins);
    mainWindow.webContents.send("update-plugin-panels", activePlugins);
});

app.whenReady().then(async () => {
    await updatePlugins();

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

    gameView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.setBrowserView(gameView);
    gameView.setBounds({ x: 0, y: 0, width: 900, height: 720 });
    gameView.webContents.loadURL("https://w1-2004.lostcity.rs/rs2.cgi");

    pluginPanel = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.addBrowserView(pluginPanel);
    pluginPanel.setBounds({ x: 900, y: 0, width: 380, height: 720 });
    pluginPanel.webContents.loadFile("pluginPanel.html");

    bottomPluginPanel = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.addBrowserView(bottomPluginPanel);
    bottomPluginPanel.setBounds({ x: 0, y: 720, width: 1280, height: 0 });
    bottomPluginPanel.webContents.loadFile("pluginPanel.html");
    bottomPluginPanel.setAutoResize({ width: true, height: bottomPanelEnabled });

    mainWindow.on("resize", () => {
        const [width, height] = mainWindow.getSize();
        gameView.setBounds({ x: 0, y: 0, width: width - 380, height });
        pluginPanel.setBounds({ x: width - 380, y: 0, width: 380, height });

        if (bottomPanelEnabled) {
            bottomPluginPanel.setBounds({ x: 0, y: height - 200, width, height: 200 });
        }
    });

    loadAllPlugins();
});
