import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ name: 'discount_percent' })
  discountPercent: number;

  @Column('decimal', { name: 'max_discount', precision: 12, scale: 0, default: 0 })
  maxDiscount: number;

  @Column({ name: 'max_usage', default: 0 })
  maxUsage: number;

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
