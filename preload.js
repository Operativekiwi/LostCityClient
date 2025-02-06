const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pluginAPI", {
  loadPlugin: (url) => ipcRenderer.invoke("load-plugin", url),
  unloadPlugin: (name) => ipcRenderer.invoke("unload-plugin", name),
  getPlugins: () => ipcRenderer.invoke("get-plugins")
});
