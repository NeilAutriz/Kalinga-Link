import 'dotenv/config';

const required = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${name}`);
  return v;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  MONGODB_URI: required('MONGODB_URI', 'mongodb://localhost:27017/kalingalink'),
  JWT_SECRET: required('JWT_SECRET', 'dev-secret-change-me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? 'false') === 'true',
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE ?? 'lax',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? 'resend',
  EMAIL_API_KEY: process.env.EMAIL_API_KEY ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'KalingaLink <no-reply@kalingalink.local>',
};
