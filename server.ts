import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import authRoutes from './backend/src/routes/auth.routes';
import taskRoutes from './backend/src/routes/task.routes';
import { errorHandler } from './backend/src/middlewares/error.middleware';
import { rateLimiter } from './backend/src/middlewares/rateLimiter.middleware';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.set('trust proxy', 1);

  // Middlewares
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json());

  // API Routes
  const authRouter = (authRoutes as any).default || authRoutes;
  const taskRouter = (taskRoutes as any).default || taskRoutes;
  const errorMiddleware = (errorHandler as any).default || errorHandler;

  app.use('/api', rateLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', taskRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API error handler
  app.use('/api', errorMiddleware);

  // Frontend Serving (Vite in Dev, Static in Prod)
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(distPath, 'index.html'));
      }
      next();
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Fallback error handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
