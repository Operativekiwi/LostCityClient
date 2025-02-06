const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { updatePlugins } = require(path.join(__dirname, "pluginUpdater"));

let mainWindow, gameView, sidePluginPanel, bottomPluginPanel;
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
    fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

let plugins = [];
let activePlugins = { right: [], bottom: [] };
const BOTTOM_PANEL_HEIGHT = 200;
const SIDE_PANEL_WIDTH = 380;

// ✅ Load Plugins and Assign Panels
async function loadAllPlugins() {
    try {
        const pluginData = fs.readFileSync(path.join(PLUGIN_DIR, "plugins.json"), "utf8");
        const parsedData = JSON.parse(pluginData);

        plugins = parsedData.plugins.map(({ name, icon, panel }) => ({
            name,
            icon: icon || "🔌",
            panel: panel || "right"
        }));

        activePlugins = {
            right: plugins.filter(p => p.panel === "right").map(p => p.name),
            bottom: plugins.filter(p => p.panel === "bottom").map(p => p.name)
        };

        console.log("✅ Plugins loaded:", plugins);
        console.log("📌 Active Plugins:", activePlugins);

        if (mainWindow) {
            mainWindow.webContents.send("plugins-loaded", { plugins, activePlugins });
        }
    } catch (error) {
        console.error("❌ Error loading plugins.json:", error);
    }
}

// ✅ Move Plugin Between Panels
ipcMain.on("move-plugin", (_, { plugin, targetPanel }) => {
    console.log(`🔄 Moving '${plugin}' to ${targetPanel} panel`);

    activePlugins.right = activePlugins.right.filter(p => p !== plugin);
    activePlugins.bottom = activePlugins.bottom.filter(p => p !== plugin);

    if (targetPanel === "right") activePlugins.right.push(plugin);
    else if (targetPanel === "bottom") activePlugins.bottom.push(plugin);

    console.log("✅ Updated Active Plugins:", activePlugins);
    mainWindow.webContents.send("update-plugin-panels", activePlugins);
});

// ✅ Initialize Electron App
app.whenReady().then(async () => {
    await updatePlugins();
    createMainWindow();
    setupViews();
    loadAllPlugins();
});

// ✅ Create Main Window
function createMainWindow() {
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

    mainWindow.on("resize", updateLayout);
}

// ✅ Set Up Browser Views
function setupViews() {
    setupGameView();
    setupSidePluginPanel();
    setupBottomPluginPanel();
}

// ✅ Game View (Main Game Area)
function setupGameView() {
    gameView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.setBrowserView(gameView);
    gameView.setBounds({ x: 0, y: 0, width: 1280 - SIDE_PANEL_WIDTH, height: 720 });
    gameView.webContents.loadURL("https://w1-2004.lostcity.rs/rs2.cgi");
}

// ✅ Right Panel (Side Plugin Panel)
function setupSidePluginPanel() {
    sidePluginPanel = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.addBrowserView(sidePluginPanel);
    sidePluginPanel.setBounds({ x: 1280 - SIDE_PANEL_WIDTH, y: 0, width: SIDE_PANEL_WIDTH, height: 720 });
    sidePluginPanel.webContents.loadFile("sidePanel.html");
}

// ✅ Bottom Panel (Bottom Plugin Panel)
function setupBottomPluginPanel() {
    bottomPluginPanel = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.addBrowserView(bottomPluginPanel);
    bottomPluginPanel.setBounds({
        x: 0,
        y: mainWindow.getSize()[1] - BOTTOM_PANEL_HEIGHT,
        width: mainWindow.getSize()[0],
        height: BOTTOM_PANEL_HEIGHT
    });
    bottomPluginPanel.setAutoResize({ width: true, height: false });
    bottomPluginPanel.webContents.loadFile("bottomPanel.html");
}

// ✅ Update Layout on Window Resize
function updateLayout() {
    const [width, height] = mainWindow.getSize();

    gameView.setBounds({ x: 0, y: 0, width: width - SIDE_PANEL_WIDTH, height });
    sidePluginPanel.setBounds({ x: width - SIDE_PANEL_WIDTH, y: 0, width: SIDE_PANEL_WIDTH, height });
    bottomPluginPanel.setBounds({ x: 0, y: height - BOTTOM_PANEL_HEIGHT, width, height: BOTTOM_PANEL_HEIGHT });
}

// ✅ Handle IPC Request for Plugins
ipcMain.handle("get-plugins", async () => {
    console.log("✅ Sending plugins data to renderer...");
    return { plugins, activePlugins };
});
