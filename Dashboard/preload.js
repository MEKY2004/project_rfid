const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  getAllStudents: () => ipcRenderer.invoke("getAllStudents"),
  matchCard: (cardNumber) => ipcRenderer.invoke("matchCard", cardNumber),
})
