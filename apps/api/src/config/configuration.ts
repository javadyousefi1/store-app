export default () => ({
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    name: process.env.DB_NAME || 'store_db',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '48h',
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'store-media',
    // Public host that browsers/CDN use to reach MinIO. When set, presigned
    // URLs are generated against this host instead of the internal endpoint
    // (which on prod is a Docker service name like "minio:9000" — not
    // reachable from a browser). Leave empty in dev.
    publicEndpoint: process.env.MINIO_PUBLIC_ENDPOINT || '',
    publicPort: process.env.MINIO_PUBLIC_PORT ? parseInt(process.env.MINIO_PUBLIC_PORT, 10) : undefined,
    publicUseSSL: process.env.MINIO_PUBLIC_USE_SSL === 'true',
    // Bucket region baked into the signature. Must match the actual MinIO
    // deployment. Default matches MinIO's out-of-the-box region.
    region: process.env.MINIO_REGION || 'us-east-1',
  },

  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS, 10) || 120,
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 90,
    maxRequestsPerHour: parseInt(process.env.OTP_MAX_REQUESTS_PER_HOUR, 10) || 5,
  },

  kavenegar: {
    // Empty in dev skips the actual SMS call and just logs the OTP —
    // handy for local development without spending SMS credits.
    apiKey: process.env.KAVENEGAR_API_KEY || '',
    // Lookup template names registered in the Kavenegar panel.
    otpTemplate: process.env.KAVENEGAR_OTP_TEMPLATE || 'otp-elina',
    orderCreatedTemplate: process.env.KAVENEGAR_ORDER_CREATED_TEMPLATE || 'order-created-elina',
  },

  cod24: {
    baseUrl:  process.env.COD24_BASE_URL  || 'https://api.cod24.ir/api',
    username: process.env.COD24_USERNAME  || '',
    password: process.env.COD24_PASSWORD  || '',
    timeoutMs: parseInt(process.env.COD24_TIMEOUT_MS, 10) || 30_000,
    // Cod24 tokens live ~1h; refresh a bit earlier so we never race the edge.
    tokenTtlSeconds:      parseInt(process.env.COD24_TOKEN_TTL_SECONDS, 10)      || 3_300,     // 55 min
    // States/cities rarely change; cache for a week (doc-suggested).
    stateCacheTtlSeconds: parseInt(process.env.COD24_STATE_CACHE_TTL_SECONDS, 10) || 604_800,   // 7 days
  },

  // Public storefront URL. Used to redirect the shopper back to the web app
  // after a payment gateway callback (success / failed pages).
  webUrl: process.env.WEB_URL || 'http://localhost:3001',

  // Public URL of THIS API. The gateway's callback_url must be reachable by
  // the shopper's browser, so this should be the externally-routable host
  // (not the internal docker service name).
  apiPublicUrl: process.env.API_PUBLIC_URL || 'http://localhost:3000',

  payment: {
    zarinpal: {
      // 36-char merchant ID. If empty the provider stays registered but any
      // initiate call fails fast with a clear error — misconfig never
      // silently sends money to the wrong merchant.
      merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
      // 'IRT' for Toman (matches our order totals) or 'IRR' for Rial.
      currency: (process.env.ZARINPAL_CURRENCY || 'IRT') as 'IRT' | 'IRR',
      // Sandbox uses a different host per ZarinPal docs.
      sandbox: process.env.ZARINPAL_SANDBOX === 'true',
    },
  },
});
