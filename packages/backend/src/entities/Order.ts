import { CreateDateColumn, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Client } from './Client';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  completionDate?: Date | null;

  @ManyToOne(() => Client, (client) => client.orders, { nullable: false })
  @JoinColumn({ name: 'clientId' })
  client!: Client;

  @Column()
  clientId!: number;

  @Column({ type: 'decimal' })
  value!: number;

  @Column({ type: 'text', default: 'Pedido' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  observations?: string | null;

  @Column({ type: 'text', default: 'pending' })
  status!: 'pending' | 'resolved';
}