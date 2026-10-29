import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OneToMany } from 'typeorm';
import { OrderStockItem } from './OrderStockItem';
import { StockMovement } from './StockMovement';

@Entity()
export class StockItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', nullable: true })
  ownerId?: number | null;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'decimal' })
  quantity!: number;

  @Column({ type: 'text' })
  unit!: string;

  @Column({ type: 'decimal', nullable: true })
  minimumQuantity?: number | null;

  @OneToMany(() => OrderStockItem, (orderItem) => orderItem.stockItem)
  orderItems!: OrderStockItem[];

  @OneToMany(() => StockMovement, (movement) => movement.stockItem)
  movements!: StockMovement[];
}