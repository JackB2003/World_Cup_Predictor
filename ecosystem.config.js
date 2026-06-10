const path = require("path");
const fs = require("fs");

function parseEnvFile(filePath) {
  const env = { NODE_ENV: "production", PORT: 3000 };
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
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

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "world-cup-predictor",
      cwd: path.join(__dirname, ".next/standalone"),
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env: parseEnvFile(path.join(__dirname, ".env")),
    },
  ],
};
