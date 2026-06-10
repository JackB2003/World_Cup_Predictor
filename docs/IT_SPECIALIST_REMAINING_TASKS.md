# World Cup Predictor — IT Specialist Remaining Tasks

**Prepared for:** IT Specialist  
**From:** Development team  
**Date:** 2026-06-10  
**VPS IP:** `2.25.152.57`  
**GitHub repo:** https://github.com/JackB2003/World_Cup_Predictor

---

## Summary

VPS setup is largely complete. GitHub Actions secrets are configured on the repo side. **One blocking issue** prevents auto-deploy from working: SSH authentication from GitHub Actions to the `deploy` user fails.

Please complete **Section 1 (required)** first, then work through the remaining sections as noted.

---

## 1. Required — Fix GitHub Actions SSH Authentication

### Problem

The deploy workflow fails with:

```text
ssh: unable to authenticate, attempted methods [none publickey]
```

The private key in GitHub Actions is valid, but the matching **public key is not present** in `/home/deploy/.ssh/authorized_keys` (or it was only added for a different user such as `root`).

### Fix

On the VPS, add the GitHub Actions public key to the `deploy` user.

**Option A — derive from the existing private key on the server:**

```bash
# The private key should already exist at:
# /root/.ssh/world_cup_deploy

# Print the public key
ssh-keygen -y -f /root/.ssh/world_cup_deploy
```

Expected output:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGTd3TcS81rP8guZbkTQwS2Q/XZkN3cHD7fx2Ipdk2Bi github-actions-world-cup-predictor
```

Add it to the `deploy` user:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo bash -c 'ssh-keygen -y -f /root/.ssh/world_cup_deploy >> /home/deploy/.ssh/authorized_keys'
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

**Option B — if the public key file exists separately:**

```bash
sudo cat /root/.ssh/world_cup_deploy.pub >> /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### Verify

From the VPS or any machine with the private key:

```bash
ssh -i /root/.ssh/world_cup_deploy deploy@2.25.152.57 "echo connected && whoami"
```

Expected:

```text
connected
deploy
```

### Confirm deploy script is executable

```bash
sudo -u deploy bash -c 'cd /var/www/world-cup-predictor && git pull origin main && bash scripts/deploy.sh'
```

With no app scaffolded yet, the script should end with:

```text
No package.json yet — code updated, app start skipped until scaffolding is complete.
```

### Notify dev team when done

Once SSH works, tell the dev team to re-run the GitHub Actions workflow. They will confirm end-to-end deploy.

**Workflow URL:** https://github.com/JackB2003/World_Cup_Predictor/actions

---

## 2. PocketBase — First-Time Admin Setup

PocketBase is running but needs an initial admin account before the app can use it.

### Access the admin panel securely

PocketBase is bound to `127.0.0.1:8090` (not publicly exposed). Use an SSH tunnel:

```bash
ssh -L 8090:127.0.0.1:8090 deploy@2.25.152.57
```

Then open in a browser on your local machine:

```text
http://localhost:8090/_/
```

### Create admin account

1. Complete the PocketBase first-run setup wizard.
2. Create an admin email and strong password.
3. **Deliver admin credentials to the project owner via a secure channel** (password manager, not email or chat).

### Hand back to dev team

- [ ] PocketBase admin account created
- [ ] Admin URL confirmed reachable via SSH tunnel
- [ ] PM2 `pocketbase` process still online after setup (`pm2 list`)

### PocketBase reference

| Item | Value |
|---|---|
| Binary | `/var/www/pocketbase/pocketbase` |
| Version | `0.39.3` |
| Port | `8090` (localhost only) |
| Data directory | `/var/www/pocketbase/pb_data/` |
| PM2 process name | `pocketbase` |

> **Important:** Never delete or overwrite `/var/www/pocketbase/pb_data/` during deploys. Back this directory up regularly.

---

## 3. Domain & SSL (When DNS Is Ready)

Not blocking for initial development, but required before going live.

### Prerequisites

- Domain DNS A record pointed to `2.25.152.57`
- Decide on URL structure, for example:
  - App: `worldcup.example.com`
  - API (optional): `api.worldcup.example.com`

### Steps

1. Update Nginx `server_name` in:

   ```text
   /etc/nginx/sites-available/world-cup-predictor
   ```

2. Test and reload Nginx:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. Install SSL with Certbot:

   ```bash
   sudo certbot --nginx -d worldcup.example.com
   # If using a separate API subdomain:
   sudo certbot --nginx -d api.worldcup.example.com
   ```

4. Confirm auto-renewal is active:

   ```bash
   sudo systemctl status certbot.timer
   ```

### Hand back to dev team

- [ ] **App domain:** `___________________________`
- [ ] **API domain (if separate):** `___________________________`
- [ ] **SSL installed:** Yes / No
- [ ] **App reachable via HTTPS:** Yes / No

---

## 4. Environment Variables on VPS

A base `.env` exists at `/var/www/world-cup-predictor/.env` with:

```env
NODE_ENV=production
PORT=3000
POCKETBASE_URL=http://127.0.0.1:8090
```

### IT responsibilities

- Keep `.env` permissions at `600`
- Keep `.env` owned by `deploy`
- **Never commit `.env` to Git**

### Dev team responsibilities

The dev team will add API keys and other secrets directly on the VPS as integrations are built. IT does not need to pre-fill these unless asked.

To edit when requested:

```bash
sudo -u deploy nano /var/www/world-cup-predictor/.env
```

After changes, restart the app (once running):

```bash
pm2 restart world-cup-predictor
```

---

## 5. PM2 — App Process (After First Real Deploy)

The `world-cup-predictor` PM2 process is **not started yet**. This is expected.

It will start automatically on the first successful GitHub Actions deploy after the dev team scaffolds the application (`package.json` exists).

### Current expected state

| PM2 process | Expected status |
|---|---|
| `pocketbase` | online |
| `world-cup-predictor` | not started yet |

### After app scaffolding

Verify:

```bash
pm2 list
pm2 logs world-cup-predictor --lines 50
curl -I http://127.0.0.1:3000
```

If the app fails to start, check:

```bash
sudo -u deploy cat /var/www/world-cup-predictor/.env
pm2 logs world-cup-predictor --err --lines 100
```

---

## 6. Security — SSH Key Hygiene

The GitHub Actions private key was shared in plaintext during initial handback (screenshot/document). After deploy is verified working, **rotate the key**.

### Rotation steps

1. Generate a new key pair on the VPS:

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-world-cup-predictor" -f /root/.ssh/world_cup_deploy_new -N ""
   ```

2. Add the new **public** key to `/home/deploy/.ssh/authorized_keys`.

3. Deliver the new **private** key to the dev team via a secure channel:
   - Password manager (1Password, Bitwarden, etc.)
   - One-time secret link (https://onetimesecret.com or similar)
   - **Do not** send via email, Slack, or chat

4. Dev team updates the `SSH_PRIVATE_KEY` GitHub Actions secret.

5. Verify deploy still works.

6. Remove the old public key from `authorized_keys`.

7. Securely delete the old private key file.

### Ongoing security checklist

- [ ] Deploy user has no unnecessary sudo access
- [ ] SSH password authentication disabled
- [ ] Root login disabled
- [ ] UFW enabled — ports 22, 80, 443 only
- [ ] PocketBase bound to `127.0.0.1` only (not `0.0.0.0`)
- [ ] `.env` file permissions are `600`
- [ ] `pb_data/` backup schedule in place
- [ ] GitHub Actions deploy key is unique to this project (not reused elsewhere)

---

## 7. Backups (Recommended Before Go-Live)

Set up regular backups for PocketBase data:

```bash
# Example: daily backup cron for deploy user
sudo crontab -u deploy -e
```

Example cron entry:

```cron
0 3 * * * tar -czf /var/backups/pocketbase-$(date +\%Y\%m\%d).tar.gz -C /var/www/pocketbase pb_data
```

Ensure `/var/backups/` exists and has sufficient disk space.

---

## 8. GitHub Actions Secrets Reference

Already configured by the dev team — **no action needed** unless values change:

| Secret | Value |
|---|---|
| `SSH_HOST` | `2.25.152.57` |
| `SSH_USER` | `deploy` |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `/var/www/world-cup-predictor` |
| `PM2_APP_NAME` | `world-cup-predictor` |
| `SSH_PRIVATE_KEY` | *(set in GitHub — do not store in repo)* |

**Settings URL:** https://github.com/JackB2003/World_Cup_Predictor/settings/secrets/actions

---

## 9. Task Checklist

### Blocking (do now)

- [ ] Add GitHub Actions public key to `/home/deploy/.ssh/authorized_keys`
- [ ] Verify SSH: `ssh -i /root/.ssh/world_cup_deploy deploy@2.25.152.57`
- [ ] Verify deploy script runs as `deploy` user
- [ ] Notify dev team to re-run GitHub Actions workflow

### Before go-live

- [ ] PocketBase admin account created (Section 2)
- [ ] Domain DNS pointed to VPS (Section 3)
- [ ] Nginx `server_name` updated (Section 3)
- [ ] SSL certificates installed (Section 3)
- [ ] Confirm app reachable via HTTPS
- [ ] PocketBase `pb_data/` backup cron configured (Section 7)
- [ ] Rotate GitHub Actions SSH key after first successful deploy (Section 6)

### Ongoing / as requested

- [ ] Add new `.env` values when dev team requests
- [ ] Monitor PM2 processes (`pm2 list`, `pm2 logs`)
- [ ] Renew SSL (should be automatic via certbot timer)

---

## 10. Notes / Blockers

Use this section to record any issues:

```
(Date) (Description of issue or deviation from plan)
```

---

*Document version: 1.0 — World Cup Predictor MVP*
