const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const PLUGIN_REPO_URL = "https://raw.githubusercontent.com/Operativekiwi/LostCityClient/main";
const PLUGIN_DIR = path.join(__dirname, "plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
}

function getFileHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

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
        resolve(true);
      });
    }).on("error", reject);
  });
}

ipcMain.handle("update-plugins", async () => {
  try {
    const plugins = ["worldSelector", "examplePlugin"];
    await Promise.all(plugins.map(downloadPlugin));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
