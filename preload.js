const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pluginAPI", {
  getPlugins: () => ipcRenderer.invoke("get-plugins"),
  loadPlugin: (name) => ipcRenderer.invoke("load-plugin", name),
});
