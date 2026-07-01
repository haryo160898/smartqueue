import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import vehicleRouter from './routes/vehicles';
import queueRouter from './routes/queues';
import serviceHistoryRouter from './routes/serviceHistory';
import queueLogsRouter from './routes/queueLogs';
import adminRouter from './routes/admin';
import userRouter from './routes/user';
import notificationsRouter from './routes/notifications';
import { errorHandler } from './middleware/auth';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
];

const isLocalhostOrigin = (origin?: string) => {
  return typeof origin === 'string' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

const authRateLimiter = (req: any, res: any, next: any) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const existing = loginAttempts.get(key);

  if (existing && now - existing.firstAttempt < 15 * 60 * 1000) {
    if (existing.count >= 10) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 429,
      });
    }

    existing.count += 1;
    loginAttempts.set(key, existing);
    return next();
  }

  loginAttempts.set(key, { count: 1, firstAttempt: now });
  return next();
};

app.disable('x-powered-by');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isLocalhostOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (_, res) => {
  res.json({ success: true, message: 'Smart Queue Backend is running' });
});

app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/queues', queueRouter);
app.use('/api/service-history', serviceHistoryRouter);
app.use('/api/queue-logs', queueLogsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/notifications', notificationsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Smart Queue Backend listening on port ${port}`);
});
