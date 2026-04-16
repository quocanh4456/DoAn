import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Schedule } from './schedule.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column('float')
  distance: number;

  @Column('decimal', { name: 'base_price', precision: 12, scale: 0 })
  basePrice: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Schedule, (schedule) => schedule.route)
  schedules: Schedule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
