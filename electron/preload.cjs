const { contextBridge } = require("electron");

const version =
  process.argv.find((a) => a.startsWith("--app-version="))?.split("=")[1] ?? "";

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  isElectron: true,
  version,
  appName: "Writing Tools",
});
