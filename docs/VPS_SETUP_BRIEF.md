# World Cup Predictor — VPS Setup Brief

**Purpose:** Prepare a VPS for automated deployments from GitHub.  
**Deploy pipeline:** `GitHub → GitHub Actions → SSH → VPS → PM2 restart`

This document is for the IT specialist setting up the server. Once complete, please return the **Handback Checklist** at the bottom so the development team can configure GitHub Actions.

---

## Overview

The World Cup Predictor MVP will:

- Host the web application on a VPS (not Vercel)
- Use **PocketBase** for the backend/database on the same VPS
- Run scheduled jobs and persistent storage on the VPS
- Auto-deploy on every push to `main` via GitHub Actions

The deployment flow:

```
Developer pushes to main
        ↓
GitHub Actions workflow triggers
        ↓
SSH into VPS as deploy user
        ↓
git pull + install deps + build (if needed)
        ↓
PM2 restart app
```

---

## 1. Server Requirements

| Requirement | Recommended |
|---|---|
| OS | Ubuntu 22.04 LTS or 24.04 LTS |
| RAM | 2 GB minimum (4 GB preferred if PocketBase + app + jobs) |
| Storage | 20 GB+ (app, PocketBase data, logs, backups) |
| Node.js | 20.x or 22.x LTS |
| Process manager | PM2 (global install) |
| Reverse proxy | Nginx (recommended) |
| SSL | Let's Encrypt via Certbot |
| Firewall | UFW — allow 22 (SSH), 80 (HTTP), 443 (HTTPS) only |

---

## 2. Create a Dedicated Deploy User

Do **not** use `root` for deployments. Create a limited user:

```bash
sudo adduser deploy
sudo usermod -aG www-data deploy
```

### SSH key for GitHub Actions

Generate a **dedicated** key pair for CI/CD (do not reuse personal keys):

```bash
ssh-keygen -t ed25519 -C "github-actions-world-cup-predictor" -f ~/.ssh/world_cup_deploy -N ""
```

- Add the **public** key to the deploy user:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/world_cup_deploy.pub /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

- Keep the **private** key secure — it will be stored as a GitHub Actions secret (see Handback Checklist).

### Harden SSH (recommended)

In `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Then: `sudo systemctl reload sshd`

---

## 3. Install Runtime Dependencies

As root or with sudo:

```bash
# Node.js (via NodeSource — adjust version as needed)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# PM2 startup on boot
pm2 startup systemd -u deploy --hp /home/deploy
# Run the command PM2 prints, then:
sudo env PATH=$PATH:/usr/bin pm2 save
```

Verify:

```bash
node -v    # e.g. v22.x
npm -v
pm2 -v
```

---

## 4. Directory Layout

Create the application root:

```bash
sudo mkdir -p /var/www/world-cup-predictor
sudo chown -R deploy:deploy /var/www/world-cup-predictor
```

Suggested layout after first deploy:

```
/var/www/world-cup-predictor/     # Git repo (app code)
/var/www/pocketbase/              # PocketBase binary + data (if separate)
/var/www/pocketbase/pb_data/      # PocketBase persistent data (DO NOT delete on deploy)
```

### Initial clone

As the `deploy` user:

```bash
cd /var/www/world-cup-predictor
git clone https://github.com/JackB2003/World_Cup_Predictor.git .
```

> **Note:** The repo is private. Either:
> - Use a GitHub deploy key / PAT on the VPS for `git pull`, or
> - Rely on GitHub Actions to rsync/scp built artifacts (dev team will confirm approach).
>
> **Preferred for this project:** VPS has read access to the repo so deploy script can `git pull`.

---

## 5. Environment Variables

Create a production `.env` on the VPS — **never commit this file**:

```bash
sudo -u deploy nano /var/www/world-cup-predictor/.env
```

Typical variables (exact list TBD by dev team):

```env
NODE_ENV=production
PORT=3000
POCKETBASE_URL=http://127.0.0.1:8090
# Add API keys, secrets, domain URLs, etc.
```

Restrict permissions:

```bash
chmod 600 /var/www/world-cup-predictor/.env
```

---

## 6. PocketBase Setup

PocketBase runs as a **separate** PM2 process and should **not** be restarted on every app deploy unless its binary changes.

```bash
sudo mkdir -p /var/www/pocketbase
sudo chown -R deploy:deploy /var/www/pocketbase
```

As `deploy`:

1. Download the PocketBase binary for Linux amd64 from [pocketbase.io](https://pocketbase.io/docs/)
2. Place it at `/var/www/pocketbase/pocketbase`
3. Ensure `pb_data/` persists across restarts

Start with PM2:

```bash
cd /var/www/pocketbase
pm2 start ./pocketbase --name pocketbase -- serve --http=127.0.0.1:8090
pm2 save
```

> **Important:** Back up `/var/www/pocketbase/pb_data/` regularly. Deploy scripts must never wipe this directory.

---

## 7. PM2 — Application Process

After the app is scaffolded, start it with PM2. Placeholder example:

```bash
cd /var/www/world-cup-predictor
npm ci
npm run build   # if applicable
pm2 start npm --name "world-cup-predictor" -- start
pm2 save
```

Or use an ecosystem file at `/var/www/world-cup-predictor/ecosystem.config.js` (dev team may provide this).

Useful commands:

```bash
pm2 list
pm2 logs world-cup-predictor
pm2 restart world-cup-predictor
pm2 restart pocketbase
```

---

## 8. Nginx Reverse Proxy (Recommended)

Example config for app + PocketBase API subdomain.

**App** — `/etc/nginx/sites-available/world-cup-predictor`:

```nginx
server {
    listen 80;
    server_name worldcup.example.com;   # replace with real domain

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**PocketBase API** (optional separate subdomain) — `api.worldcup.example.com`:

```nginx
server {
    listen 80;
    server_name api.worldcup.example.com;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and SSL:

```bash
sudo ln -s /etc/nginx/sites-available/world-cup-predictor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d worldcup.example.com -d api.worldcup.example.com
```

---

## 9. Deploy Script (Server-Side)

Create `/var/www/world-cup-predictor/scripts/deploy.sh` (dev team may supply final version):

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/world-cup-predictor"
PM2_APP_NAME="world-cup-predictor"

cd "$APP_DIR"
git pull origin main
npm ci
npm run build    # remove if no build step
pm2 restart "$PM2_APP_NAME"
```

```bash
chmod +x /var/www/world-cup-predictor/scripts/deploy.sh
```

GitHub Actions will SSH in and run this script (or equivalent inline commands).

---

## 10. GitHub Actions Secrets (Dev Team Configures)

Once VPS setup is complete, provide the values below to the dev team. They will add these as **GitHub repository secrets** at:

`https://github.com/JackB2003/World_Cup_Predictor/settings/secrets/actions`

| Secret name | Value |
|---|---|
| `SSH_HOST` | VPS IP or hostname |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | Full private key contents (ed25519) |
| `SSH_PORT` | `22` (or custom port) |
| `DEPLOY_PATH` | `/var/www/world-cup-predictor` |
| `PM2_APP_NAME` | `world-cup-predictor` |

---

## 11. Security Checklist

- [ ] Deploy user has minimal sudo (ideally none)
- [ ] SSH password auth disabled
- [ ] Root login disabled
- [ ] UFW enabled (22, 80, 443 only)
- [ ] `.env` not world-readable
- [ ] PocketBase bound to `127.0.0.1` (not public) — exposed via Nginx only
- [ ] SSL certificates installed and auto-renewing
- [ ] `pb_data/` backup schedule in place
- [ ] Deploy SSH key is unique to this project

---

## 12. Handback Checklist

**Please return the following to the development team when setup is complete:**

### Connection

- [ ] **SSH_HOST:** `___________________________`
- [ ] **SSH_PORT:** `___________________________` (default: 22)
- [ ] **SSH_USER:** `___________________________` (expected: `deploy`)
- [ ] **SSH_PRIVATE_KEY:** *(paste full key, or deliver via secure channel)*

### Paths & processes

- [ ] **DEPLOY_PATH:** `___________________________` (expected: `/var/www/world-cup-predictor`)
- [ ] **PM2_APP_NAME:** `___________________________` (expected: `world-cup-predictor`)
- [ ] **PM2_POCKETBASE_NAME:** `___________________________` (expected: `pocketbase`)
- [ ] **Node version:** `___________________________` (e.g. `v22.x`)
- [ ] **Package manager:** `___________________________` (npm / pnpm / yarn)

### PocketBase

- [ ] **PocketBase path:** `___________________________`
- [ ] **PocketBase port:** `___________________________` (expected: `8090`)
- [ ] **PocketBase data dir:** `___________________________`
- [ ] **PocketBase admin URL:** `___________________________`

### Networking & domains

- [ ] **App domain:** `___________________________`
- [ ] **API domain (if separate):** `___________________________`
- [ ] **SSL installed:** Yes / No
- [ ] **App internal port:** `___________________________` (e.g. `3000`)

### Git access on VPS

- [ ] **Can `deploy` user `git pull` from private repo?** Yes / No
- [ ] **If yes, method used:** Deploy key / PAT / other: `___________________________`

### Environment

- [ ] **`.env` created on VPS:** Yes / No
- [ ] **List of env var names set** (not values): `___________________________`

### Verification

- [ ] **PM2 `world-cup-predictor` status:** online / not yet deployed
- [ ] **PM2 `pocketbase` status:** online / offline
- [ ] **App reachable via domain:** Yes / No
- [ ] **Test SSH from external machine with deploy key:** Yes / No

### Notes / blockers

```
(Any issues, custom firewall rules, non-standard setup, etc.)
```

---

## 13. Contacts & Repo

| Item | Value |
|---|---|
| GitHub repo | https://github.com/JackB2003/World_Cup_Predictor |
| Repo visibility | Private |
| Deploy branch | `main` |
| Deploy trigger | Push to `main` |

---

*Document version: 1.0 — World Cup Predictor MVP*
