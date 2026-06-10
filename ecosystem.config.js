const path = require("path");
const { parseEnvFile } = require("./lib/env-file.js");

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "world-cup-predictor",
      cwd: path.join(__dirname, ".next/standalone"),
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env: parseEnvFile(path.join(__dirname, ".env"), { NODE_ENV: "production", PORT: "3000" }),
    },
  ],
};
