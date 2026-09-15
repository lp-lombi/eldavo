import express from 'express';
import { DataSource } from 'typeorm';
import { createClientRouter } from './routes/clients';
import { createOrderRouter } from './routes/orders';

export function createApp(dataSource: DataSource): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/clients', createClientRouter(dataSource));
  app.use('/orders', createOrderRouter(dataSource));
  return app;
}
