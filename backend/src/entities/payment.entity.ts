import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id' })
  ticketId: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.payments)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column('decimal', { precision: 12, scale: 0 })
  amount: number;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ name: 'payment_method', default: 'VNPAY' })
  paymentMethod: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
