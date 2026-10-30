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
import { User } from './entities/User';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isHttpImage(value?: string | null): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function addPublicMetadata(html: string, title: string, description: string, url: string, image?: string | null): string {
  const metadata = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:site_name" content="${escapeHtml(title)}">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    ...(image ? [`<meta property="og:image" content="${escapeHtml(image)}">`, `<meta name="twitter:image" content="${escapeHtml(image)}">`] : []),
  ].join('');
  return html.replace('<head>', `<head>${metadata}`);
}

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
    app.get(/^\/([^/]+)\/?$/, async (request, response, next) => {
      const identifier = request.params[0];
      const user = await dataSource.getRepository(User).findOne({
        where: [{ username: identifier }, { publicSlug: identifier }],
      });
      if (!user?.publicBookingEnabled) {
        next();
        return;
      }

      const title = user.publicBrandName?.trim() || user.landingTitle?.trim() || user.username;
      const description = user.publicDescription?.trim() || user.heroDescription?.trim() || `Reservá tu turno con ${title}.`;
      const image = isHttpImage(user.heroImage) ? user.heroImage : isHttpImage(user.brandLogo) ? user.brandLogo : null;
      const publicUrl = `${request.protocol}://${request.get('host')}${request.path}`;
      const indexHtml = fs.readFileSync(path.join(frontendDirectory, 'index.html'), 'utf8');
      response.send(addPublicMetadata(indexHtml, title, description, publicUrl, image));
    });
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
