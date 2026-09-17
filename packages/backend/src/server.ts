import 'reflect-metadata';
import { createApp } from './app';
import { createDataSource } from './database';
import { ensureAdminUser } from './auth';
import { loadEnvironment } from './config';

if (!loadEnvironment()) {
  process.exit(1);
}

const dataSource = createDataSource();
const port = Number(process.env.PORT ?? 3005);

dataSource.initialize()
  .then(() => {
    return ensureAdminUser(dataSource);
  })
  .then(() => {
    createApp(dataSource).listen(port, () => {
      console.log(`API running at http://localhost:${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Unable to initialize database', error);
    process.exit(1);
  });
