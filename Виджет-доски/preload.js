// Мостик между виджетом и доской: даёт кнопкам на доске доступ к окну.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("goalBoard", {
  isWidget: true,
  minimize: () => ipcRenderer.send("widget-minimize"),
  togglePin: () => ipcRenderer.invoke("widget-toggle-pin"),
});
