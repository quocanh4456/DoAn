import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Schedule } from './schedule.entity';
import { Bus } from './bus.entity';
import { Ticket } from './ticket.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'schedule_id' })
  scheduleId: number;

  @ManyToOne(() => Schedule, (schedule) => schedule.trips, { eager: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ name: 'bus_id' })
  busId: number;

  @ManyToOne(() => Bus, (bus) => bus.trips, { eager: true })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ name: 'driver_name' })
  driverName: string;

  @Column({ type: 'date', name: 'departure_date' })
  departureDate: string;

  @Column({ name: 'available_seats' })
  availableSeats: number;

  @Column({ default: 'SCHEDULED' })
  status: string;

  @OneToMany(() => Ticket, (ticket) => ticket.trip)
  tickets: Ticket[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
