# EC2 deploy — api-kb.techtimize.co

Nginx proxies `https://api-kb.techtimize.co` to Node on `127.0.0.1:8000`.
Systemd runs the API and the embedding worker.

Security group: open **80** and **443**. Do **not** open **8000** publicly.

## 1. On the EC2 box (Ubuntu)

```bash
sudo apt update
sudo apt install -y nginx docker.io docker-compose-plugin certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo usermod -aG docker $USER
```

Log out and back in so Docker group applies.

## 2. App files

```bash
cd /KB_Backend   # or your clone path
git pull
cp .env.example .env
nano .env
```

Set real keys. For Qdrant Cloud keep your cloud URL and API key.
For local Redis on this box:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=dummy
```

## 3. First deploy

```bash
cd /KB_Backend
sudo bash deploy/setup.sh
sudo certbot --nginx -d api-kb.techtimize.co
```

`setup.sh` installs systemd units, Nginx, starts Valkey, and starts:

- `kb-api` → `node server.js`
- `kb-worker` → `node worker.js`

## 4. Later updates (after you push)

```bash
cd /KB_Backend
sudo bash deploy/update.sh
```

Or push to `master` and let GitHub Actions deploy (see CI/CD below).

## 5. CI/CD (GitHub Actions)

Workflow: [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

- **PR / push** → install deps + syntax check
- **push to `master`** → SSH into EC2, pull latest, `npm install`, restart `kb-api` + `kb-worker`

### One-time GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Example | Notes |
| --- | --- | --- |
| `EC2_HOST` | `3.15.224.154` | Public IP or DNS of the instance |
| `EC2_USER` | `ubuntu` | SSH user |
| `EC2_SSH_KEY` | `-----BEGIN ...` | Full private key PEM |
| `EC2_APP_DIR` | `/KB_Backend` | Optional; defaults to `/KB_Backend` |
| `EC2_PORT` | `22` | Optional |

### EC2 SSH setup

1. Create a deploy key pair (or use your existing `.pem`):

```bash
ssh-keygen -t ed25519 -C "github-actions-kb" -f kb-deploy -N ""
```

2. Add the **public** key to the EC2 user:

```bash
cat kb-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

3. Paste the **private** key contents into `EC2_SSH_KEY`.

4. Security group: allow SSH **22** from GitHub Actions IPs, or temporarily `0.0.0.0/0` for testing (tighten later).

5. Give the deploy user passwordless restart (if not root):

```bash
echo 'ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart kb-api, /bin/systemctl restart kb-worker, /bin/systemctl status kb-api, /bin/systemctl status kb-worker, /usr/bin/systemctl restart kb-api, /usr/bin/systemctl restart kb-worker, /usr/bin/systemctl --no-pager --full status kb-api, /usr/bin/systemctl --no-pager --full status kb-worker' | sudo tee /etc/sudoers.d/kb-deploy
sudo chmod 440 /etc/sudoers.d/kb-deploy
```

If the repo is private, also add a read-only deploy key on the EC2 clone so `git fetch` works.

### Useful commands

```bash
sudo systemctl status kb-api kb-worker
sudo journalctl -u kb-api -f
sudo journalctl -u kb-worker -f
sudo nginx -t && sudo systemctl reload nginx
curl -I https://api-kb.techtimize.co/api/v1/conversations
```
