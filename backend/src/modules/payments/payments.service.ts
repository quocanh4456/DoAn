import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment, Ticket } from '../../entities';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Ticket) private ticketsRepo: Repository<Ticket>,
    private ticketsService: TicketsService,
    private configService: ConfigService,
  ) {}

  async createVnpayUrl(ticketId: number, ipAddr: string) {
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
    });
    const saved = await this.paymentsRepo.save(payment);

    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');
    const vnpUrl = this.configService.get<string>('VNPAY_URL');
    const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL');

    const date = new Date();
    const createDate = this.formatDate(date);
    const orderId = this.formatOrderId(date, saved.id);

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode || '',
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan ve xe #${ticket.id}`,
      vnp_OrderType: 'billpayment',
      vnp_Amount: String(Number(ticket.totalPrice) * 100),
      vnp_ReturnUrl: returnUrl || '',
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secretKey || '');
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    const paymentUrl =
      vnpUrl + '?' + new URLSearchParams(sortedParams).toString();

    saved.transactionId = orderId;
    await this.paymentsRepo.save(saved);

    return { paymentUrl, paymentId: saved.id };
  }

  async handleVnpayReturn(query: Record<string, string>) {
    const secureHash = query['vnp_SecureHash'];
    const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');

    const params = { ...query };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secretKey || '');
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const txnRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];

    const payment = await this.paymentsRepo.findOne({
      where: { transactionId: txnRef },
    });

    if (!payment) {
      return { success: false, message: 'Không tìm thấy giao dịch' };
    }

    if (secureHash !== signed) {
      payment.status = 'FAILED';
      await this.paymentsRepo.save(payment);
      return { success: false, message: 'Chữ ký không hợp lệ' };
    }

    if (responseCode === '00') {
      payment.status = 'SUCCESS';
      payment.paidAt = new Date();
      await this.paymentsRepo.save(payment);
      await this.ticketsService.confirmPayment(payment.ticketId);
      return { success: true, message: 'Thanh toán thành công' };
    }

    payment.status = 'FAILED';
    await this.paymentsRepo.save(payment);
    return { success: false, message: 'Thanh toán thất bại' };
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }

  private formatOrderId(date: Date, paymentId: number): string {
    return this.formatDate(date) + '_' + paymentId;
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }
}
