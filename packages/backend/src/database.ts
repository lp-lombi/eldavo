import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Client } from './entities/Client';
import { Order } from './entities/Order';
import { User } from './entities/User';
import { Note } from './entities/Note';
import { Tag } from './entities/Tag';
import { StockItem } from './entities/StockItem';
import { OrderStockItem } from './entities/OrderStockItem';
import { StockMovement } from './entities/StockMovement';
import { GoogleCalendarConnection } from './entities/GoogleCalendarConnection';
import { Appointment } from './entities/Appointment';
import { AppointmentRequest } from './entities/AppointmentRequest';
import { LandingService } from './entities/LandingService';

export function createDataSource(database = process.env.DATABASE_PATH ?? 'eldavo.db'): DataSource {
  return new DataSource({
    type: 'sqlite',
    database,
    entities: [Client, Order, User, Note, Tag, StockItem, OrderStockItem, StockMovement, GoogleCalendarConnection, Appointment, AppointmentRequest, LandingService],
    synchronize: true,
  });
}
