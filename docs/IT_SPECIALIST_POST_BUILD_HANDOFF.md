# World Cup Predictor — IT Specialist Post-Build Handoff

**Prepared for:** IT Specialist  
**From:** Development team  
**Date:** 2026-06-10  
**VPS IP:** `2.25.152.57`  
**GitHub repo:** https://github.com/JackB2003/World_Cup_Predictor  
**Supersedes in part:** [IT_SPECIALIST_REMAINING_TASKS.md](IT_SPECIALIST_REMAINING_TASKS.md) (Sections 5 and deploy expectations)

---

## Summary

The development team has completed the full MVP application scaffold. The repo now includes a production Next.js app (`package.json`, build scripts, PocketBase integration, prediction jobs, and cron templates).

**Auto-deploy is still blocked** until GitHub Actions can SSH into the `deploy` user. Everything else below should be done in order after that fix.

---

## Blocking item (do this first)

### GitHub Actions SSH authentication

**Status:** Blocked — deploy workflow cannot authenticate.

**Error:**

```text
ssh: unable to authenticate, attempted methods [none publickey]
```

**Cause:** The GitHub Actions private key is configured in GitHub Secrets, but the matching **public key is not in** `/home/deploy/.ssh/authorized_keys` (it may only exist for `root` or another user).

**Fix on VPS:**

```bash
# Derive public key from existing deploy key
ssh-keygen -y -f /root/.ssh/world_cup_deploy

# Add to deploy user
sudo mkdir -p /home/deploy/.ssh
sudo bash -c 'ssh-keygen -y -f /root/.ssh/world_cup_deploy >> /home/deploy/.ssh/authorized_keys'
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

**Verify:**

```bash
ssh -i /root/.ssh/world_cup_deploy deploy@2.25.152.57 "echo connected && whoami"
```

Expected output:

```text
connected
deploy
```

**Then notify the dev team** to re-run the deploy workflow:  
https://github.com/JackB2003/World_Cup_Predictor/actions

---

## What changed since the last IT brief

| Before | Now |
|--------|-----|
| No `package.json` — deploy pulled code only | Full Next.js app is in the repo |
| `world-cup-predictor` PM2 process not expected | PM2 will **auto-start on first successful deploy** |
| Deploy script exited early after `git pull` | Deploy script runs `npm ci`, `npm run build`, then PM2 start/restart |

After SSH is fixed, the deploy pipeline will:

1. `git pull origin main`
2. `npm ci`
3. `npm run build`
4. `pm2 start` or `pm2 restart world-cup-predictor`

---

## What IT needs to update

### 1. Verify first deploy (after SSH fix)

```bash
sudo -u deploy bash -c 'cd /var/www/world-cup-predictor && git pull origin main && bash scripts/deploy.sh'
```

**Expected PM2 state after deploy:**

| Process | Expected status |
|---------|-----------------|
| `pocketbase` | online |
| `world-cup-predictor` | online |

**Verify app responds:**

```bash
pm2 list
pm2 logs world-cup-predictor --lines 50
curl -I http://127.0.0.1:3000
curl -s http://127.0.0.1:3000/api/health
```

Nginx should proxy public traffic to port `3000` (existing config).

---

### 2. PocketBase admin account (required before app uses live data)

PocketBase runs at `127.0.0.1:8090` (localhost only — correct).

**Access via SSH tunnel:**

```bash
ssh -L 8090:127.0.0.1:8090 deploy@2.25.152.57
```

Open: http://localhost:8090/_/

**IT actions:**

- [ ] Complete first-run admin setup if not already done
- [ ] Deliver admin email + password to project owner via **secure channel** (password manager — not email/chat)
- [ ] Confirm `pocketbase` PM2 process stays online after setup

**Dev team will run** (on VPS, after admin credentials are in `.env`):

```bash
cd /var/www/world-cup-predictor
npm run setup:pb   # creates database collections (one-time)
npm run seed       # loads initial tournament data
```

---

### 3. Environment variables on VPS

File: `/var/www/world-cup-predictor/.env`  
Owner: `deploy` · Permissions: `600` · **Never commit to Git**

**Current base (already set):**

```env
NODE_ENV=production
PORT=3000
POCKETBASE_URL=http://127.0.0.1:8090
```

**IT should add/update these** (values provided separately by dev team via secure channel):

```env
# PocketBase admin (required for seed/setup scripts)
POCKETBASE_ADMIN_EMAIL=your_admin_email@example.com
POCKETBASE_ADMIN_PASSWORD=your_secure_password_here

# API-Football (server-side only — never expose to browser or Git)
API_FOOTBALL_KEY=your_api_football_key_here
API_FOOTBALL_MOCK=true
WORLD_CUP_LEAGUE_ID=1
WORLD_CUP_SEASON=2026

# OpenAI (optional — enhances prediction reasoning)
OPENAI_API_KEY=your_openai_api_key_here

# Required in production — protects manual refresh API endpoint
ADMIN_REFRESH_TOKEN=your_refresh_token_here
```

**After any `.env` change:**

```bash
pm2 restart world-cup-predictor
```

Set `API_FOOTBALL_MOCK=false` only when the dev team confirms live API integration is ready.

---

### 4. Cron jobs (before tournament go-live)

Install for the `deploy` user. Template is in the repo at `scripts/cron.example`.

```bash
sudo crontab -u deploy -e
```

```cron
# Morning data refresh — 6:00 AM daily
0 6 * * * cd /var/www/world-cup-predictor && /usr/bin/npm run refresh:morning >> /var/log/world-cup-refresh.log 2>&1

# Pre-match refresh — adjust time to ~90 min before first daily kickoff
30 11 * * * cd /var/www/world-cup-predictor && /usr/bin/npm run refresh:prematch >> /var/log/world-cup-refresh.log 2>&1

# PocketBase backup — 3:00 AM daily
0 3 * * * tar -czf /var/backups/pocketbase-$(date +\%Y\%m\%d).tar.gz -C /var/www/pocketbase pb_data
```

Ensure `/var/backups/` exists and has sufficient disk space.

---

### 5. Domain and SSL (when DNS is ready)

Not blocking for initial deploy, required before public go-live.

- [ ] Point domain A record to `2.25.152.57`
- [ ] Update Nginx `server_name` in `/etc/nginx/sites-available/world-cup-predictor`
- [ ] Run Certbot: `sudo certbot --nginx -d <your-domain>`
- [ ] Confirm `certbot.timer` is active for auto-renewal
- [ ] Hand back final HTTPS URL to dev team

---

### 6. Security — SSH key rotation (after first successful deploy)

The GitHub Actions private key was previously shared in plaintext. **Rotate after deploy is confirmed working.**

1. Generate new key pair on VPS
2. Add new public key to `/home/deploy/.ssh/authorized_keys`
3. Deliver new private key to dev team via secure channel
4. Dev team updates `SSH_PRIVATE_KEY` in GitHub Actions secrets
5. Verify deploy still works
6. Remove old public key; delete old private key file

---

## Fallow note (no IT action required)

**Fallow** is a code-quality tool used by the development team. It runs in **GitHub Actions on pull requests only** (workflow: `.github/workflows/fallow.yml`). It is **not** part of the VPS runtime.

| Question | Answer |
|----------|--------|
| Does IT need to install Fallow on the VPS? | **No** |
| Does Fallow affect PM2, Nginx, or PocketBase? | **No** |
| Does Fallow block production deploys? | **No** — only PR checks |
| What does it do? | Audits TypeScript/JavaScript for dead code, duplication, complexity, and architecture boundaries |

The dev team manages Fallow locally and in CI. IT can ignore it unless specifically asked to troubleshoot a failed PR check.

---

## GitHub Actions secrets (already configured)

No IT action needed unless values change.

| Secret | Value |
|--------|-------|
| `SSH_HOST` | `2.25.152.57` |
| `SSH_USER` | `deploy` |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `/var/www/world-cup-predictor` |
| `PM2_APP_NAME` | `world-cup-predictor` |
| `SSH_PRIVATE_KEY` | *(in GitHub — do not store in repo)* |

Settings: https://github.com/JackB2003/World_Cup_Predictor/settings/secrets/actions

---

## Task checklist

### Blocking (do now)

- [ ] Fix SSH: add GitHub Actions public key to `/home/deploy/.ssh/authorized_keys`
- [ ] Verify: `ssh -i /root/.ssh/world_cup_deploy deploy@2.25.152.57`
- [ ] Notify dev team to re-run GitHub Actions deploy workflow

### After SSH fix

- [ ] Confirm deploy completes (`npm ci`, `npm run build`, PM2 restart)
- [ ] Confirm `curl http://127.0.0.1:3000` returns 200
- [ ] Confirm `curl http://127.0.0.1:3000/api/health` returns JSON

### Before go-live

- [ ] PocketBase admin account created; credentials handed to owner securely
- [ ] `.env` updated with PocketBase admin + API keys (as provided by dev team)
- [ ] Cron jobs installed (`scripts/cron.example`)
- [ ] PocketBase backup cron active; `/var/backups/` has space
- [ ] Domain DNS + SSL configured (when ready)
- [ ] Rotate GitHub Actions SSH key after first successful deploy

### Ongoing

- [ ] Monitor `pm2 list` — both `pocketbase` and `world-cup-predictor` should stay online
- [ ] Add new `.env` values when dev team requests
- [ ] Never delete `/var/www/pocketbase/pb_data/` during deploys

---

## Handback to dev team

When complete, please confirm:

| Item | Value |
|------|-------|
| SSH deploy working | Yes / No |
| `world-cup-predictor` PM2 online | Yes / No |
| App reachable on VPS (`curl :3000`) | Yes / No |
| PocketBase admin created | Yes / No |
| Cron jobs installed | Yes / No |
| Domain (if set) | `___________________________` |
| SSL installed | Yes / No |

---

## Notes / blockers

```
(Date) (Description of issue or deviation from plan)
```

---

*Document version: 2.0 — Post MVP scaffold handoff*
