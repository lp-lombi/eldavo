import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Client } from './Client';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type AppointmentSyncStatus = 'not_connected' | 'pending' | 'synced' | 'failed';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  ownerId!: number;

  @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client?: Client | null;

  @Column({ type: 'integer', nullable: true })
  clientId?: number | null;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'datetime' })
  startsAt!: Date;

  @Column({ type: 'datetime' })
  endsAt!: Date;

  @Column({ type: 'text', default: 'scheduled' })
  status!: AppointmentStatus;

  @Column({ type: 'text', default: 'pending' })
  syncStatus!: AppointmentSyncStatus;

  @Column({ type: 'text', nullable: true })
  syncError?: string | null;

  @Column({ type: 'text', nullable: true })
  googleEventId?: string | null;

  @Column({ type: 'datetime', nullable: true })
  lastSyncAttemptAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}