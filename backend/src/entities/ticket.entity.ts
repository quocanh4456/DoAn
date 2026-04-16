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
import { Trip } from './trip.entity';
import { User } from './user.entity';
import { Payment } from './payment.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'trip_id' })
  tripId: number;

  @ManyToOne(() => Trip, (trip) => trip.tickets)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.tickets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'seat_count' })
  seatCount: number;

  @Column({ name: 'pick_up_location' })
  pickUpLocation: string;

  @Column({ name: 'drop_off_location' })
  dropOffLocation: string;

  @Column('decimal', { name: 'total_price', precision: 12, scale: 0 })
  totalPrice: number;

  @Column({ default: 'PENDING' })
  status: string;

  @OneToMany(() => Payment, (payment) => payment.ticket)
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
