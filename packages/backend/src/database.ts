import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Client } from './entities/Client';
import { Order } from './entities/Order';

export function createDataSource(database = process.env.DATABASE_PATH ?? 'eldavo.db'): DataSource {
  return new DataSource({
    type: 'sqlite',
    database,
    entities: [Client, Order],
    synchronize: true,
  });
}
