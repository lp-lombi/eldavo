import express from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { createClientRouter } from './routes/clients';
import { createOrderRouter } from './routes/orders';
import { requireAuth } from './auth';
import { createAuthRouter } from './routes/auth';
import { createExportRouter } from './routes/export';

export function createApp(dataSource: DataSource): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/auth', createAuthRouter(dataSource));
  app.use('/clients', requireAuth, createClientRouter(dataSource));
  app.use('/orders', requireAuth, createOrderRouter(dataSource));
  app.use('/export.csv', requireAuth, createExportRouter(dataSource));
  return app;
}
