const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch"); // Ensure this is installed
const { JSDOM } = require("jsdom");
const { updatePlugins } = require(path.join(__dirname, "pluginUpdater"));

let mainWindow;
let gameView;
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

let plugins = [];

async function loadAllPlugins() {
  plugins = [];

  const pluginFiles = fs.readdirSync(PLUGIN_DIR).filter(file => file.endsWith(".js"));

  let pluginMetadata = {};
  try {
    const pluginData = fs.readFileSync(path.join(PLUGIN_DIR, "plugins.json"), "utf8");
    pluginMetadata = JSON.parse(pluginData).plugins.reduce((acc, p) => {
      acc[p.name] = p.icon || "🔌";
      return acc;
    }, {});
  } catch (error) {
    console.error("Error loading plugins.json:", error);
  }

  plugins = pluginFiles.map(file => {
    const name = file.replace(".js", "");
    return {
      name,
      icon: pluginMetadata[name] || "🔌",
    };
  });

  console.log("Sending plugins to renderer:", plugins);

  if (mainWindow) {
    mainWindow.webContents.send("plugins-loaded", plugins);
  }
}

ipcMain.handle("get-plugins", async () => plugins);

ipcMain.on("changeWorld", (_, url) => {
  if (gameView) {
    console.log(`Changing game view to: ${url}`);
    gameView.webContents.loadURL(url);
  } else {
    console.error("Error: gameView is not initialized.");
  }
});

// ✅ IPC HANDLERS FOR PLAYER LOOKUP PLUGIN
ipcMain.handle("fetch-player-skills", async (_, playerName) => {
  try {
    const url = `https://2004.lostcity.rs/hiscores/player/${encodeURIComponent(playerName)}`;
    const response = await fetch(url);
    if (response.redirected) return null; // Player does not exist

    const html = await response.text();
    const { document } = new JSDOM(html).window;

    const skills = {};
    document.querySelectorAll("table tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length === 6) {
        const skillName = cells[2]?.textContent.trim();
        const level = parseInt(cells[4]?.textContent.trim(), 10);
        const xp = parseInt(cells[5]?.textContent.trim().replace(/,/g, ""), 10);
        if (skillName && !isNaN(level) && !isNaN(xp)) {
          skills[skillName.toLowerCase()] = { level, xp };
        }
      }
    });

    return skills;
  } catch (error) {
    console.error("Error fetching player skills:", error);
    return null;
  }
});

ipcMain.handle("fetch-adventure-log", async (_, playerName) => {
  try {
    const url = `https://2004.lostcity.rs/player/adventurelog/${encodeURIComponent(playerName)}`;
    const response = await fetch(url);
    const html = await response.text();
    const { document } = new JSDOM(html).window;

    const entries = [];
    document.querySelectorAll('div[style="text-align: left"]').forEach((div) => {
      const timestamp = div.querySelector("span")?.textContent.trim() || "";
      const content = div.textContent.split("\n").map(line => line.trim()).filter(line => line && !line.includes(timestamp))[0] || "";
      if (timestamp && content) {
        entries.push({ timestamp, content });
      }
    });

    return entries;
  } catch (error) {
    console.error("Failed to fetch adventure log:", error);
    return [];
  }
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
      preload: path.join(__dirname, "preload.js"),
    },
  });

  gameView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setBrowserView(gameView);
  gameView.setBounds({ x: 0, y: 0, width: 900, height: 720 });
  gameView.webContents.loadURL("https://w1-2004.lostcity.rs/rs2.cgi");

  const pluginPanel = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.addBrowserView(pluginPanel);
  pluginPanel.setBounds({ x: 900, y: 0, width: 380, height: 720 });
  pluginPanel.webContents.loadFile("pluginPanel.html");

  mainWindow.on("resize", () => {
    const [width, height] = mainWindow.getSize();
    gameView.setBounds({ x: 0, y: 0, width: width - 380, height });
    pluginPanel.setBounds({ x: width - 380, y: 0, width: 380, height });
  });

  loadAllPlugins();
});
