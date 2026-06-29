# Deployment

## Runtime

- Process manager: `PM2`
- Reverse proxy / TLS: `Caddy`
- App process name: `wallet-packet-backend`

## Recommended server directory

```bash
/var/www/walletPacketBackend
```

## First-time server setup

### 1. Clone the repository

```bash
cd /var/www
git clone <your-github-repo-url> walletPacketBackend
cd walletPacketBackend
```

### 2. Create production environment file

```bash
cp .env.example .env
```

Then edit `.env` with the production database and WeChat settings.

### 3. Install dependencies and build once

```bash
npm ci
npm run prisma:generate
npm run build
```

### 4. Start PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## Caddy example

```caddy
wallet-api.cqtlly.top {
  reverse_proxy 127.0.0.1:3000
}
```

Reload Caddy after updating the configuration:

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

## GitHub Actions secrets

Configure these repository secrets in GitHub:

- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_PORT`
- `DEPLOY_PATH`
- `PM2_APP_NAME`

Recommended values:

- `DEPLOY_PATH=/var/www/walletPacketBackend`
- `PM2_APP_NAME=wallet-packet-backend`

## Deployment behavior

On every push to `main`, the workflow will:

1. Run `npm ci`
2. Run `npm run prisma:generate`
3. Run `npm run build`
4. SSH into the server
5. Run:
   - `git fetch --all`
   - `git reset --hard origin/main`
   - `npm ci`
   - `npm run prisma:generate`
   - `npm run build`
   - `pm2 startOrReload ecosystem.config.cjs --only wallet-packet-backend`

## Notes

- This workflow does **not** run `prisma migrate dev` on the server.
- If you add production migrations later, prefer a dedicated deploy step such as:

```bash
npx prisma migrate deploy
```
 
- Ensure the server has:
  - Node.js 22
  - npm
  - PM2
  - Git
