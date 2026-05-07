import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

const app = express();

// Trust proxy (Railway / any reverse proxy) so secure cookies + rate limit IPs work
app.set('trust proxy', 1);

// Allow comma-separated list of origins in CLIENT_ORIGIN
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / curl / server-to-server (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
// Forum posts carry base64 media (images + short video clips). Apply a 15 MB
// limit for that route family first; all other routes stay at 1 MB.
app.use('/api/v1/forum', express.json({ limit: '15mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Auth rate limit
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'kalingalink-api' }));

app.use('/api/v1', routes);

app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`KalingaLink API listening on :${env.PORT}`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start:', err);
  process.exit(1);
});
