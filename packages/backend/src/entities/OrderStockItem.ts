import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './Order';
import { StockItem } from './StockItem';

@Entity()
export class OrderStockItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.stockItems, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column()
  orderId!: number;

  @ManyToOne(() => StockItem, (stockItem) => stockItem.orderItems, { nullable: false })
  @JoinColumn({ name: 'stockItemId' })
  stockItem!: StockItem;

  @Column()
  stockItemId!: number;

  @Column({ type: 'decimal' })
  quantity!: number;
}