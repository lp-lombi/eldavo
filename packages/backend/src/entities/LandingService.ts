import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class LandingService {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  ownerId!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  image?: string | null;

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;
}
