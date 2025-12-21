import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import billingRouter from './routes/billing';
import creatorRouter from './routes/creator';
import mediaRouter from './routes/media';
import notificationsRouter from './routes/notifications';
import postsRouter from './routes/posts';

dotenv.config();

const app = express();
const webOriginsRaw = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
const allowedOrigins = webOriginsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, server-to-server) where Origin is undefined.
      if (!origin) return callback(null, true);
      // Allow one or more explicit origins: WEB_ORIGIN="https://a.com,https://b.com"
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/creator', creatorRouter);
app.use('/posts', postsRouter);
app.use('/billing', billingRouter);
app.use('/admin', adminRouter);
app.use('/notifications', notificationsRouter);
app.use('/media', mediaRouter);

export { app };

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => {
    console.log(`[api] listening on ${port}`);
  });
}
