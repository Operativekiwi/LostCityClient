// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("pluginAPI", {
  getPlugins: () => ipcRenderer.invoke("get-plugins"),
  loadPlugin: (name) => ipcRenderer.invoke("load-plugin", name), // Allow fetching full plugin
  receive: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});


