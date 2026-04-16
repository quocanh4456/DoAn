import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Route } from './route.entity';
import { Trip } from './trip.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'route_id' })
  routeId: number;

  @ManyToOne(() => Route, (route) => route.schedules)
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ type: 'time', name: 'departure_time' })
  departureTime: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Trip, (trip) => trip.schedule)
  trips: Trip[];
}
