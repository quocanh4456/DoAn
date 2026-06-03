import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { Payment, Ticket } from '../../entities';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class PaymentsService {
  private payos: PayOS;

  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Ticket) private ticketsRepo: Repository<Ticket>,
    @Inject(forwardRef(() => TicketsService))
    private ticketsService: TicketsService,
    private configService: ConfigService,
  ) {
    this.payos = new PayOS({
      clientId: this.configService.get<string>('PAYOS_CLIENT_ID') || '',
      apiKey: this.configService.get<string>('PAYOS_API_KEY') || '',
      checksumKey: this.configService.get<string>('PAYOS_CHECKSUM_KEY') || '',
    });
  }

  async createPayOSUrl(ticketId: number) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');
    if (ticket.status !== 'PENDING') {
      throw new BadRequestException('Vé không ở trạng thái chờ thanh toán');
    }

    const payment = this.paymentsRepo.create({
      ticketId: ticket.id,
      amount: ticket.totalPrice,
      status: 'PENDING',
      paymentMethod: 'PAYOS',
      description: `tickets:${ticket.id}`,
    });
    const saved = await this.paymentsRepo.save(payment);

    const returnUrl = (
      this.configService.get<string>('PAYOS_RETURN_URL') || ''
    ).trim();
    const cancelUrl = (
      this.configService.get<string>('PAYOS_CANCEL_URL') || ''
    ).trim();

    const orderCode = saved.id;

    const paymentLink = await this.payos.paymentRequests.create({
      orderCode,
      amount: Math.round(Number(ticket.totalPrice)),
      description: `Ve xe ${ticket.id}`,
      returnUrl,
      cancelUrl,
    });

    saved.transactionId = String(orderCode);
    await this.paymentsRepo.save(saved);

    return { paymentUrl: paymentLink.checkoutUrl, paymentId: saved.id };
  }

  /**
   * Create a single PayOS payment link for multiple tickets (e.g. round-trip).
   * The combined ticketIds are stored in the description field as "tickets:1,2"
   * so that handlePayOSReturn can confirm all of them at once.
   */
  async createPayOSUrlMulti(ticketIds: number[]) {
    const tickets = await this.ticketsRepo.findBy({ id: In(ticketIds) });

    if (tickets.length !== ticketIds.length) {
      throw new NotFoundException('Một hoặc nhiều vé không tồn tại');
    }
    for (const t of tickets) {
      if (t.status !== 'PENDING') {
        throw new BadRequestException(
          `Vé #${t.id} không ở trạng thái chờ thanh toán`,
        );
      }
    }

    const totalAmount = tickets.reduce(
      (sum, t) => sum + Number(t.totalPrice),
      0,
    );

    // Use ticketId of the FIRST ticket as the FK column (required by schema)
    // All ticket IDs are stored in description for later retrieval
    const payment = this.paymentsRepo.create({
      ticketId: tickets[0].id,
      amount: totalAmount,
      status: 'PENDING',
      paymentMethod: 'PAYOS',
      description: `tickets:${ticketIds.join(',')}`,
    });
    const saved = await this.paymentsRepo.save(payment);

    const returnUrl = (
      this.configService.get<string>('PAYOS_RETURN_URL') || ''
    ).trim();
    const cancelUrl = (
      this.configService.get<string>('PAYOS_CANCEL_URL') || ''
    ).trim();

    const orderCode = saved.id;
    const paymentLink = await this.payos.paymentRequests.create({
      orderCode,
      amount: Math.round(totalAmount),
      description: `Ve khu hoi ${ticketIds.join('-')}`,
      returnUrl,
      cancelUrl,
    });

    saved.transactionId = String(orderCode);
    await this.paymentsRepo.save(saved);

    return { paymentUrl: paymentLink.checkoutUrl, paymentId: saved.id };
  }

  async handlePayOSReturn(query: Record<string, string>) {
    const { code, orderCode, cancel } = query;

    const payment = await this.paymentsRepo.findOne({
      where: { transactionId: String(orderCode) },
    });

    if (!payment) {
      return { success: false, message: 'Không tìm thấy giao dịch' };
    }

    // ── Idempotency: đã xử lý rồi thì không làm lại ──────────────
    if (payment.status === 'SUCCESS') {
      return { success: true, message: 'Thanh toán thành công' };
    }
    if (payment.status === 'FAILED') {
      return { success: false, message: 'Thanh toán thất bại' };
    }

    // Parse all ticketIds from description field (e.g. "tickets:1,2")
    const ticketIds = this.parseTicketIds(payment);

    // Người dùng bấm hủy
    if (cancel === 'true') {
      payment.status = 'FAILED';
      await this.paymentsRepo.save(payment);
      return { success: false, message: 'Bạn đã hủy thanh toán', isCancelled: true };
    }

    // Thanh toán thành công (code = '00')
    if (code === '00') {
      payment.status = 'SUCCESS';
      payment.paidAt = new Date();
      await this.paymentsRepo.save(payment);

      // Confirm all tickets associated with this payment
      await Promise.all(
        ticketIds.map((id) => this.ticketsService.confirmPayment(id)),
      );

      return { success: true, message: 'Thanh toán thành công' };
    }

    payment.status = 'FAILED';
    await this.paymentsRepo.save(payment);
    return { success: false, message: 'Thanh toán thất bại' };
  }

  /** Parse ticketIds from "tickets:1,2" in description field */
  private parseTicketIds(payment: Payment): number[] {
    try {
      if (payment.description && payment.description.startsWith('tickets:')) {
        return payment.description
          .replace('tickets:', '')
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n));
      }
    } catch {
      /* fallback */
    }
    // Legacy payments that don't have description — use ticketId FK
    return [payment.ticketId];
  }

  /**
   * Create a PayOS payment URL for a guest ticket.
   * Validates guest email before creating the link.
   */
  async createGuestPaymentUrl(ticketId: number, guestEmail: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Không tìm thấy vé');
    if (!ticket.guestEmail || ticket.guestEmail !== guestEmail) {
      throw new BadRequestException('Email không khớp với thông tin vé');
    }
    if (ticket.status !== 'PENDING') {
      throw new BadRequestException('Vé không ở trạng thái chờ thanh toán');
    }

    return this.createPayOSUrl(ticketId);
  }
}
