import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from './trip.entity';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column({ name: 'bus_type' })
  busType: string;

  @Column({ name: 'total_seats' })
  totalSeats: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Trip, (trip) => trip.bus)
  trips: Trip[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
