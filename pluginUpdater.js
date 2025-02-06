const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const PLUGIN_REPO_URL = "https://raw.githubusercontent.com/Operativekiwi/LostCityClient/main/plugins";
const PLUGIN_LIST_URL = `${PLUGIN_REPO_URL}/plugins.json`;
const PLUGIN_DIR = path.join(__dirname, "plugins");

// Ensure the plugin directory exists
if (!fs.existsSync(PLUGIN_DIR)) {
    fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

// ✅ Compute file hash to check for updates
function getFileHash(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

// ✅ Fetch plugin list from repository
async function fetchPluginList() {
    try {
        const data = await fetchJSON(PLUGIN_LIST_URL);
        if (!data || !Array.isArray(data.plugins)) throw new Error("Invalid plugin list format");
        return data.plugins;
    } catch (error) {
        console.error("❌ Failed to fetch plugin list:", error);
        return [];
    }
}

// ✅ Download plugin if missing or outdated
async function downloadPlugin(plugin) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(PLUGIN_DIR, `${plugin.name}.js`);
        const url = `${PLUGIN_REPO_URL}/${plugin.name}.js`;

        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(`❌ Failed to download ${plugin.name}: ${res.statusCode}`);
                return;
            }

            let data = "";
            res.on("data", chunk => (data += chunk));
            res.on("end", () => {
                if (fs.existsSync(filePath)) {
                    const existingHash = getFileHash(fs.readFileSync(filePath, "utf-8"));
                    const newHash = getFileHash(data);
                    if (existingHash === newHash) {
                        console.log(`✅ ${plugin.name} is already up to date.`);
                        return resolve(false);
                    }
                }
                fs.writeFileSync(filePath, data);
                console.log(`📥 Updated plugin: ${plugin.name}`);
                resolve(true);
            });
        }).on("error", reject);
    });
}

// ✅ Helper function for fetching JSON
async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return reject(`❌ HTTP ${res.statusCode}`);
            let data = "";
            res.on("data", chunk => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject("❌ Invalid JSON format");
                }
            });
        }).on("error", reject);
    });
}

// ✅ IPC Handler: Update Plugins
ipcMain.handle("update-plugins", async () => {
    try {
        console.log("🔍 Checking for plugin updates...");
        const pluginList = await fetchPluginList();
        await Promise.all(pluginList.map(downloadPlugin));
        console.log("✅ All plugins are up to date.");
        return { success: true };
    } catch (error) {
        console.error("❌ Plugin update failed:", error);
        return { success: false, error: error.message };
    }
});

// ✅ Main function for manual calls
async function updatePlugins() {
    try {
        console.log("🔄 Checking for updates...");
        const pluginList = await fetchPluginList();
        await Promise.all(pluginList.map(plugin => downloadPlugin(plugin)));
        console.log("✅ Plugins updated successfully.");
        return { success: true };
    } catch (error) {
        console.error("❌ Plugin update failed:", error);
        return { success: false, error: error.message };
    }
}

// ✅ Export update function for use in `main.js`
module.exports = { updatePlugins };
