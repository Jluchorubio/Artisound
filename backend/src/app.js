import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import courseRoutes from './routes/course.routes.js';
import classRoutes from './routes/class.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import gradeRoutes from './routes/grade.routes.js';
import progressRoutes from './routes/progress.routes.js';
import drawingRoutes from './routes/drawing.routes.js';
import { getMailerStatus } from './utils/mailer.js';

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.frontendUrls.includes(origin)) {
        return callback(null, true);
      }
      if (/^https?:\/\/localhost(?::\d+)?$/i.test(origin)) {
        return callback(null, true);
      }
      if (/^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    smtpConfigured: getMailerStatus().configured,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', classRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api', gradeRoutes);
app.use('/api', progressRoutes);
app.use('/api', drawingRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
