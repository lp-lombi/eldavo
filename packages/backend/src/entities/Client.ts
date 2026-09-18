import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './Order';
import { Note } from './Note';
import { Tag } from './Tag';

@Entity()
export class Client {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  email?: string | null;

  @Column({ nullable: true, type: 'text' })
  phone?: string | null;

  @Column({ nullable: true, type: 'text' })
  address?: string | null;

  @Column({ nullable: true, type: 'text' })
  facebookUrl?: string | null;

  @ManyToMany(() => Tag, (tag) => tag.clients)
  @JoinTable()
  tags!: Tag[];

  @OneToMany(() => Order, (order) => order.client)
  orders!: Order[];

  @OneToMany(() => Note, (note) => note.client)
  notes!: Note[];
}