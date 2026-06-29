export const appConfig = () => ({
  app: {
    name: process.env.APP_NAME ?? 'wallet-packet-backend',
    port: Number(process.env.PORT ?? 3000),
    env: process.env.NODE_ENV ?? 'development',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'replace-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID ?? '',
    appSecret: process.env.WECHAT_APP_SECRET ?? '',
  },
});
