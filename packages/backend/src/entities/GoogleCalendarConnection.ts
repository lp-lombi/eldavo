import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class GoogleCalendarConnection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  ownerId!: number;

  @Column({ type: 'text', nullable: true })
  googleEmail?: string | null;

  @Column({ type: 'text' })
  calendarId!: string;

  @Column({ type: 'text' })
  accessTokenEncrypted!: string;

  @Column({ type: 'text' })
  refreshTokenEncrypted!: string;

  @Column({ type: 'datetime', nullable: true })
  tokenExpiresAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}