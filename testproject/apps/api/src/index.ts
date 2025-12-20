import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import creatorRouter from './routes/creator';
import postsRouter from './routes/posts';
import billingRouter from './routes/billing';
import adminRouter from './routes/admin';
import notificationsRouter from './routes/notifications';
import mediaRouter from './routes/media';

dotenv.config();

const app = express();
const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

app.use(cors({ origin: webOrigin, credentials: true }));
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

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`[api] listening on ${port}`);
});
