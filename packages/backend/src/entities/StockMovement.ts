import { CreateDateColumn, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './Order';
import { StockItem } from './StockItem';

@Entity()
export class StockMovement {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => StockItem, (stockItem) => stockItem.movements, { nullable: false })
  @JoinColumn({ name: 'stockItemId' })
  stockItem!: StockItem;

  @Column()
  stockItemId!: number;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order?: Order | null;

  @Column({ nullable: true })
  orderId?: number | null;

  @Column({ type: 'text' })
  type!: 'entry' | 'exit' | 'reversal';

  @Column({ type: 'decimal' })
  quantity!: number;
}