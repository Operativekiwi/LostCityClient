const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pluginAPI", {
  updatePlugins: () => ipcRenderer.invoke("update-plugins"),
});
