const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const PLUGIN_REPO_URL = "https://raw.githubusercontent.com/Operativekiwi/LostCityClient/main/plugins";
const PLUGIN_LIST_URL = `${PLUGIN_REPO_URL}/plugins.json`; // Plugin index file
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

function getFileHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Function to fetch a JSON file from GitHub
async function fetchPluginList() {
  return new Promise((resolve, reject) => {
    https.get(PLUGIN_LIST_URL, (res) => {
      if (res.statusCode !== 200) {
        return reject(`Failed to fetch plugin list: ${res.statusCode}`);
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const plugins = JSON.parse(data);
          resolve(plugins);
        } catch (error) {
          reject("Invalid JSON format from GitHub");
        }
      });
    }).on("error", reject);
  });
}

// Function to download a plugin if it's missing or outdated
async function downloadPlugin(pluginName) {
  return new Promise((resolve, reject) => {
    const url = `${PLUGIN_REPO_URL}/${pluginName}.js`;
    const filePath = path.join(PLUGIN_DIR, `${pluginName}.js`);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(`Failed to download ${pluginName}: ${res.statusCode}`);
        return;
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (fs.existsSync(filePath)) {
          const existingHash = getFileHash(fs.readFileSync(filePath, "utf-8"));
          const newHash = getFileHash(data);
          if (existingHash === newHash) {
            console.log(`${pluginName} is already up to date.`);
            return resolve(false);
          }
        }

        fs.writeFileSync(filePath, data);
        console.log(`Updated plugin: ${pluginName}`);
        resolve(true);
      });
    }).on("error", reject);
  });
}

// IPC Handler to update plugins
ipcMain.handle("update-plugins", async () => {
  try {
    console.log("Checking for plugin updates...");
    const pluginList = await fetchPluginList(); // Fetch list from GitHub
    if (!pluginList.plugins || !Array.isArray(pluginList.plugins)) {
      throw new Error("Invalid plugin list format");
    }

    await Promise.all(pluginList.plugins.map(downloadPlugin)); // Download/update all plugins

    console.log("All plugins are up to date.");
    return { success: true };
  } catch (error) {
    console.error("Plugin update failed:", error);
    return { success: false, error: error.message };
  }
});
async function updatePlugins() {
  try {
    console.log("Checking for plugin updates...");
    const pluginList = await fetchPluginList(); // Fetch list from GitHub
    if (!pluginList.plugins || !Array.isArray(pluginList.plugins)) {
      throw new Error("Invalid plugin list format");
    }

    // Extract only plugin names
    await Promise.all(pluginList.plugins.map(plugin => downloadPlugin(plugin.name)));

    console.log("All plugins are up to date.");
    return { success: true };
  } catch (error) {
    console.error("Plugin update failed:", error);
    return { success: false, error: error.message };
  }
}

  // Export the function for `main.js`
  module.exports = { updatePlugins };
  