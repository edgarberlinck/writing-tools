import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import pkg from "./package.json";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  optimizeDeps: {
    exclude: ["pouchdb-browser", "pouchdb-find"],
    include: ["spark-md5", "vuvuzela"],
  },
});
