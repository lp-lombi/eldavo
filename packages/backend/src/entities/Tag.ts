import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Client } from './Client';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', nullable: true })
  ownerId?: number | null;

  @Column({ unique: true })
  name!: string;

  @Column({ default: '#8ee6b1' })
  color!: string;

  @ManyToMany(() => Client, (client) => client.tags)
  clients!: Client[];
}