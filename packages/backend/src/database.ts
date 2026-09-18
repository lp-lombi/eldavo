import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Client } from './entities/Client';
import { Order } from './entities/Order';
import { User } from './entities/User';
import { Note } from './entities/Note';
import { Tag } from './entities/Tag';

export function createDataSource(database = process.env.DATABASE_PATH ?? 'eldavo.db'): DataSource {
  return new DataSource({
    type: 'sqlite',
    database,
    entities: [Client, Order, User, Note, Tag],
    synchronize: true,
  });
}
