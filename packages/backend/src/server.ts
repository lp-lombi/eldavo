import 'reflect-metadata';
import { createApp } from './app';
import { createDataSource } from './database';

const dataSource = createDataSource();
const port = Number(process.env.PORT ?? 3000);

dataSource.initialize()
  .then(() => {
    createApp(dataSource).listen(port, () => {
      console.log(`API running at http://localhost:${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Unable to initialize database', error);
    process.exit(1);
  });
