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

// On Windows, add node_modules/.bin to PATH
if (isWindows) {
  const binPath = path.join(process.cwd(), "node_modules", ".bin");
  env.PATH = `${binPath};${env.PATH || ""}`;
}

const spawnOptions = {
  env,
  stdio: "inherit",
  cwd: process.cwd(),
};

// On Windows, use cmd.exe as shell to handle .cmd files
if (isWindows) {
  spawnOptions.shell = "cmd.exe";
}

const tauriCmd = isWindows ? "tauri" : path.join(process.cwd(), "node_modules", ".bin", "tauri");
const child = spawn(tauriCmd, tauriArgs, spawnOptions);

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
