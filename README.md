# wallet-packet-backend

NestJS backend for the Wallet Packet WeChat Mini Program.

## Stack

- NestJS
- Prisma
- MySQL
- PM2
- Caddy

## Quick start

1. Update `.env`
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run prisma:generate`
4. Sync schema in development if needed: `npm run prisma:push`
5. Start dev server: `npm run start:dev`

## API docs

After startup, open `/docs`.

## Deployment

Deployment files are included for:

- `PM2`: [ecosystem.config.cjs](./ecosystem.config.cjs)
- GitHub Actions: [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)
- Server setup notes: [DEPLOYMENT.md](./DEPLOYMENT.md)
