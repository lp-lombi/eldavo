import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { createClientRouter } from './routes/clients';
import { createOrderRouter } from './routes/orders';
import { requireAuth } from './auth';
import { createAuthRouter } from './routes/auth';
import { createExportRouter } from './routes/export';
import { createTagRouter } from './routes/tags';

export function createApp(dataSource: DataSource): express.Express {
  const app = express();
  const frontendDirectory = [
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../public'),
  ].find((directory) => fs.existsSync(directory));

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/auth', createAuthRouter(dataSource));
  app.use('/clients', requireAuth, createClientRouter(dataSource));
  app.use('/tags', requireAuth, createTagRouter(dataSource));
  app.use('/orders', requireAuth, createOrderRouter(dataSource));
  app.use('/export.csv', requireAuth, createExportRouter(dataSource));

  if (frontendDirectory) {
    app.use(express.static(frontendDirectory));
    app.use((request, response, next) => {
      const isApiRequest = ['/health', '/auth', '/clients', '/tags', '/orders', '/export.csv']
        .some((prefix) => request.path === prefix || request.path.startsWith(`${prefix}/`));

      if (request.method === 'GET' && !isApiRequest && request.accepts('html')) {
        response.sendFile(path.join(frontendDirectory, 'index.html'));
        return;
      }

      next();
    });
  }

  return app;
}
