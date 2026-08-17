# EC2 deploy — api-kb.tachtimize.co

Nginx proxies `https://api-kb.tachtimize.co` to Node on `127.0.0.1:8000`.
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
cd ~/KB_Backend   # or your clone path
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
cd ~/KB_Backend
sudo bash deploy/setup.sh
sudo certbot --nginx -d api-kb.tachtimize.co
```

`setup.sh` installs systemd units, Nginx, starts Valkey, and starts:

- `kb-api` → `node server.js`
- `kb-worker` → `node worker.js`

## 4. Later updates (after you push)

```bash
cd ~/KB_Backend
sudo bash deploy/update.sh
```

## Useful commands

```bash
sudo systemctl status kb-api kb-worker
sudo journalctl -u kb-api -f
sudo journalctl -u kb-worker -f
sudo nginx -t && sudo systemctl reload nginx
curl https://api-kb.tachtimize.co/chat?message=ping
```
