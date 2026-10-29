import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'text', default: UserRole.ADMIN })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  publicDescription?: string | null;

  @Column({ type: 'boolean', default: true })
  publicBookingEnabled!: boolean;

  @Column({ type: 'text', nullable: true })
  landingTitle?: string | null;

  @Column({ type: 'text', nullable: true })
  landingAbout?: string | null;

  @Column({ type: 'text', nullable: true })
  heroTitle?: string | null;

  @Column({ type: 'text', nullable: true })
  heroDescription?: string | null;

  @Column({ type: 'text', nullable: true })
  aboutTitle?: string | null;

  @Column({ type: 'text', nullable: true })
  aboutDescription?: string | null;

}