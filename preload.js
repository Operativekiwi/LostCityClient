const { contextBridge, ipcRenderer } = require("electron");

// ✅ Expose plugin-related API functions
contextBridge.exposeInMainWorld("pluginAPI", {
    getPlugins: () => ipcRenderer.invoke("get-plugins"),
    loadPlugin: (name) => ipcRenderer.invoke("load-plugin", name),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});

// ✅ Expose world switching function
contextBridge.exposeInMainWorld("electronAPI", {
    changeWorld: (url) => ipcRenderer.send("changeWorld", url)
});
