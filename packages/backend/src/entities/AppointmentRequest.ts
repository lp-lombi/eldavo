import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type AppointmentRequestStatus = 'pending' | 'confirmed' | 'rejected';

@Entity()
export class AppointmentRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  ownerId!: number;

  @Column({ type: 'text' })
  requesterName!: string;

  @Column({ type: 'text' })
  requesterEmail!: string;

  @Column({ type: 'text', nullable: true })
  requesterPhone?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'datetime' })
  startsAt!: Date;

  @Column({ type: 'datetime' })
  endsAt!: Date;

  @Column({ type: 'text', default: 'pending' })
  status!: AppointmentRequestStatus;

  @Column({ type: 'integer', nullable: true })
  appointmentId?: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
