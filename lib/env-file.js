const fs = require("fs");
const path = require("path");

/** @param {string} content */
function parseEnvLines(content) {
  /** @type {Record<string, string>} */
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

/** @param {string} filePath @param {Record<string, string>} [defaults] */
function parseEnvFile(filePath, defaults = {}) {
  if (!fs.existsSync(filePath)) return { ...defaults };
  return { ...defaults, ...parseEnvLines(fs.readFileSync(filePath, "utf8")) };
}

/** @param {string} [cwd] */
function loadEnvIntoProcess(cwd = process.cwd()) {
  const envPath = path.resolve(cwd, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const [key, val] of Object.entries(parseEnvLines(fs.readFileSync(envPath, "utf8")))) {
    if (!process.env[key]) process.env[key] = val;
  }
}

module.exports = { parseEnvLines, parseEnvFile, loadEnvIntoProcess };
