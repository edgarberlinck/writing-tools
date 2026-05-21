#!/usr/bin/env node

const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const tauriArgs = process.argv.slice(2);
if (tauriArgs.length === 0) {
  console.error("Usage: node scripts/tauri-with-rustup.cjs <tauri-args...>");
  process.exit(1);
}

function capture(cmd, args) {
  return spawnSync(cmd, args, { encoding: "utf8" });
}

const env = { ...process.env };

const cargoResult = capture("rustup", ["which", "cargo"]);
if (cargoResult.status === 0) {
  const cargoPath = cargoResult.stdout.trim();
  const cargoBin = path.dirname(cargoPath);
  env.PATH = `${cargoBin}${path.delimiter}${env.PATH || ""}`;
  env.CARGO = cargoPath;
}

const rustcResult = capture("rustup", ["which", "rustc"]);
if (rustcResult.status === 0) {
  env.RUSTC = rustcResult.stdout.trim();
}

// Find tauri in node_modules/.bin
const isWindows = process.platform === "win32";
const tauriPath = path.join(process.cwd(), "node_modules", ".bin", "tauri");

// On Windows, spawn .cmd files with shell option  
const spawnOptions = {
  env,
  stdio: "inherit",
  cwd: process.cwd(),
};

if (isWindows) {
  spawnOptions.shell = true;
}

const child = spawn(isWindows ? `"${tauriPath}.cmd"` : tauriPath, tauriArgs, spawnOptions);

child.on("exit", (code, signal) => {
  if (typeof code === "number") {
    process.exit(code);
  }
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(1);
});
