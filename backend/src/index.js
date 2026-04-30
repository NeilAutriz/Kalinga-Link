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

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
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
