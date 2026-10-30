import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { createClientRouter } from './routes/clients';
import { createOrderRouter } from './routes/orders';
import { requireAdmin, requireAuth } from './auth';
import { createAdminRouter } from './routes/admin';
import { createAuthRouter } from './routes/auth';
import { createExportRouter } from './routes/export';
import { createTagRouter } from './routes/tags';
import { createStockRouter } from './routes/stock';
import { createAppointmentRouter } from './routes/appointments';
import { createPublicBookingRouter } from './routes/publicBooking';
import { createAppointmentRequestRouter } from './routes/appointmentRequests';

export function createApp(dataSource: DataSource): express.Express {
  const app = express();
  const frontendDirectory = [
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../public'),
  ].find((directory) => fs.existsSync(directory));

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(dataSource));
  app.use('/api/public-booking', createPublicBookingRouter(dataSource));
  if (frontendDirectory) {
    app.get('/admin', (_request, response) => response.sendFile(path.join(frontendDirectory, 'index.html')));
  }
  app.use('/api/admin', requireAdmin, createAdminRouter(dataSource));
  app.use('/api/clients', requireAuth, createClientRouter(dataSource));
  app.use('/api/tags', requireAuth, createTagRouter(dataSource));
  app.use('/api/stock', requireAuth, createStockRouter(dataSource));
  app.use('/api/orders', requireAuth, createOrderRouter(dataSource));
  app.use('/api/appointments', requireAuth, createAppointmentRouter(dataSource));
  app.use('/api/appointment-requests', requireAuth, createAppointmentRequestRouter(dataSource));
  app.use('/api/export.csv', requireAuth, createExportRouter(dataSource));

  if (frontendDirectory) {
    app.use(express.static(frontendDirectory));
    app.use((request, response, next) => {
      const isApiRequest = ['/api']
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
