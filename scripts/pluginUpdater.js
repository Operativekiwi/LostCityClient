const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PLUGIN_REPO_URL = "https://raw.githubusercontent.com/Operativekiwi/LostCityClient/main";
const PLUGIN_DIR = path.join(__dirname, "../plugins");

if (!fs.existsSync(PLUGIN_DIR)) {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
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

      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        resolve(true);
      });
    }).on("error", reject);
  });
}

// IPC Handler for Electron
ipcMain.handle("update-plugins", async () => {
  try {
    const plugins = ["worldSelector", "examplePlugin"]; // Define your plugins
    await Promise.all(plugins.map(downloadPlugin));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
