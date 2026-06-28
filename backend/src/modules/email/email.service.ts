import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Ticket } from '../../entities/ticket.entity';
import { User } from '../../entities/user.entity';
import { Trip } from '../../entities/trip.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM');

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Đặt lại mật khẩu - VinaCoach</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a8f 0%,#2a5bd7 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="background:#f97316;border-radius:10px;width:36px;height:36px;display:inline-block;text-align:center;line-height:36px;">
                  <span style="color:white;font-size:18px;">🚌</span>
                </div>
                <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                  Vina<span style="color:#fb923c;">Coach</span>
                </span>
              </div>
              <h1 style="color:white;font-size:24px;font-weight:700;margin:20px 0 4px;">Đặt lại mật khẩu</h1>
              <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0;">
                Xin chào <strong style="color:white;">${fullName}</strong>, chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn.
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px;text-align:center;">
              <div style="background:#f8faff;border:1px solid #e2e8f0;border-radius:12px;padding:24px 20px;margin-bottom:28px;">
                <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
                  Nhấn vào nút bên dưới để đặt lại mật khẩu. Link này sẽ hết hạn sau <strong>15 phút</strong>.
                </p>
                <a href="${resetLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#1a3a8f,#2a5bd7);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                  🔑 Đặt lại mật khẩu
                </a>
              </div>

              <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;text-align:left;">
                <p style="color:#92400e;font-size:12px;margin:0;line-height:1.6;">
                  ⚠️ Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="color:#64748b;font-size:13px;margin:0 0 6px;">
                Cần hỗ trợ? Liên hệ hotline <strong style="color:#1a3a8f;">1900 0000</strong>
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                © 2026 VinaCoach. Email này được gửi tự động, vui lòng không reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: '🔑 VinaCoach — Đặt lại mật khẩu của bạn',
        html,
      });
      this.logger.log(`Email đặt lại mật khẩu đã gửi tới ${to}`);
    } catch (err) {
      this.logger.error(`Không thể gửi email đặt lại mật khẩu tới ${to}: ${err}`);
    }
  }

  async sendTicketConfirmation(ticket: Ticket, user: User): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM');
    const to = user.email;

    const route = ticket.trip?.schedule?.route;
    const schedule = ticket.trip?.schedule;
    const bus = ticket.trip?.bus;

    const formatPrice = (price: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Xác nhận vé xe - VinaCoach</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a8f 0%,#2a5bd7 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="background:#f97316;border-radius:10px;width:36px;height:36px;display:inline-block;text-align:center;line-height:36px;">
                  <span style="color:white;font-size:18px;">🚌</span>
                </div>
                <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                  Vina<span style="color:#fb923c;">Coach</span>
                </span>
              </div>
              <div style="margin-top:20px;">
                <div style="display:inline-block;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.3);border-radius:50px;padding:8px 20px;">
                  <span style="color:#86efac;font-size:14px;font-weight:600;">✅ Thanh toán thành công</span>
                </div>
              </div>
              <h1 style="color:white;font-size:26px;font-weight:700;margin:16px 0 4px;">Vé xe đã được xác nhận!</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
                Xin chào <strong style="color:white;">${user.fullName}</strong>, cảm ơn bạn đã đặt vé tại VinaCoach.
              </p>
            </td>
          </tr>

          <!-- ROUTE BANNER -->
          <tr>
            <td style="background:#1e3a8a;padding:18px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:right;width:40%;">
                    <div style="color:white;font-size:18px;font-weight:700;">${route?.origin ?? '—'}</div>
                    <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:2px;">Điểm đi</div>
                  </td>
                  <td style="text-align:center;padding:0 12px;width:20%;">
                    <div style="color:#fb923c;font-size:20px;">✈</div>
                    ${route?.distance ? `<div style="color:rgba(255,255,255,0.5);font-size:10px;margin-top:2px;">${route.distance} km</div>` : ''}
                  </td>
                  <td style="text-align:left;width:40%;">
                    <div style="color:white;font-size:18px;font-weight:700;">${route?.destination ?? '—'}</div>
                    <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:2px;">Điểm đến</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TICKET INFO -->
          <tr>
            <td style="padding:28px 40px;">

              <!-- Mã vé -->
              <div style="background:#f8faff;border:1.5px dashed #c7d7f5;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
                <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mã vé</div>
                <div style="color:#1a3a8f;font-size:28px;font-weight:800;letter-spacing:2px;margin-top:4px;">#${ticket.id}</div>
              </div>

              <!-- Info grid -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;width:50%;vertical-align:top;">
                    ${infoCell('📅', 'Ngày khởi hành', formatDate(ticket.trip?.departureDate ?? ''))}
                  </td>
                  <td style="padding-bottom:12px;padding-left:12px;width:50%;vertical-align:top;">
                    ${infoCell('🕐', 'Giờ khởi hành', schedule?.departureTime ?? '—')}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;vertical-align:top;">
                    ${infoCell('👤', 'Tài xế', ticket.trip?.driverName ?? '—')}
                  </td>
                  <td style="padding-bottom:12px;padding-left:12px;vertical-align:top;">
                    ${infoCell('🚌', 'Xe', bus ? `${bus.busType} — ${bus.licensePlate}` : '—')}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;vertical-align:top;">
                    ${infoCell('💺', 'Số chỗ', `${ticket.seatCount} chỗ`)}
                  </td>
                  <td style="padding-bottom:12px;padding-left:12px;vertical-align:top;">
                    ${infoCell('🪑', 'Tổng ghế xe', bus ? `${bus.totalSeats} ghế` : '—')}
                  </td>
                </tr>
              </table>

              <!-- Pickup / dropoff -->
              <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:4px 0 24px;">
                <div style="color:#15803d;font-size:12px;font-weight:700;margin-bottom:12px;">📍 ĐIỂM ĐÓN & TRẢ</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:10px;">
                      <span style="display:inline-block;background:#22c55e;color:white;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:10px;font-weight:700;margin-right:8px;">↑</span>
                      <span style="color:#374151;font-size:13px;"><strong>Điểm đón:</strong> ${ticket.pickUpLocation}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="display:inline-block;background:#ef4444;color:white;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:10px;font-weight:700;margin-right:8px;">↓</span>
                      <span style="color:#374151;font-size:13px;"><strong>Điểm trả:</strong> ${ticket.dropOffLocation}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Total price -->
              <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:1.5px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="color:#1e40af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Tổng tiền đã thanh toán</div>
                <div style="color:#1a3a8f;font-size:32px;font-weight:800;margin-top:6px;">${formatPrice(Number(ticket.totalPrice))}</div>
              </div>

              <!-- Note -->
              <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
                <p style="color:#92400e;font-size:12px;margin:0;line-height:1.6;">
                  ⚠️ Vui lòng <strong>đến điểm đón trước 15 phút</strong> và mang theo thông tin vé này (mã vé <strong>#${ticket.id}</strong>) khi lên xe để nhân viên kiểm tra.
                </p>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
                Cần hỗ trợ? Liên hệ hotline <strong style="color:#1a3a8f;">1900 0000</strong>
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                © 2026 VinaCoach. Email này được gửi tự động, vui lòng không reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `✅ VinaCoach — Vé xe #${ticket.id} đã được xác nhận`,
        html,
      });
      this.logger.log(`Email xác nhận vé #${ticket.id} đã gửi tới ${to}`);
    } catch (err) {
      this.logger.error(`Không thể gửi email xác nhận vé #${ticket.id}: ${err}`);
    }
  }

  async sendGuestBookingEmail(
    ticket: Ticket,
    trip: Trip,
    guestName: string,
    guestEmail: string,
    paymentPageUrl: string,
  ): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM');

    const route = trip?.schedule?.route;
    const schedule = trip?.schedule;
    const bus = trip?.bus;

    const formatPrice = (price: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Xác nhận đặt vé - VinaCoach</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a8f 0%,#2a5bd7 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="background:#f97316;border-radius:10px;width:36px;height:36px;display:inline-block;text-align:center;line-height:36px;">
                  <span style="color:white;font-size:18px;">🚌</span>
                </div>
                <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                  Vina<span style="color:#fb923c;">Coach</span>
                </span>
              </div>
              <div style="margin-top:20px;">
                <div style="display:inline-block;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.3);border-radius:50px;padding:8px 20px;">
                  <span style="color:#fbbf24;font-size:14px;font-weight:600;">⏳ Chờ thanh toán</span>
                </div>
              </div>
              <h1 style="color:white;font-size:26px;font-weight:700;margin:16px 0 4px;">Vé xe đã được đặt cho bạn!</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">
                Xin chào <strong style="color:white;">${guestName}</strong>, nhân viên VinaCoach đã đặt vé hộ bạn. Vui lòng thanh toán trong <strong style="color:#fbbf24;">30 phút</strong>.
              </p>
            </td>
          </tr>

          <!-- ROUTE BANNER -->
          <tr>
            <td style="background:#1e3a8a;padding:18px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:right;width:40%;">
                    <div style="color:white;font-size:18px;font-weight:700;">${route?.origin ?? '—'}</div>
                    <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:2px;">Điểm đi</div>
                  </td>
                  <td style="text-align:center;padding:0 12px;width:20%;">
                    <div style="color:#fb923c;font-size:20px;">✈</div>
                  </td>
                  <td style="text-align:left;width:40%;">
                    <div style="color:white;font-size:18px;font-weight:700;">${route?.destination ?? '—'}</div>
                    <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:2px;">Điểm đến</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TICKET INFO -->
          <tr>
            <td style="padding:28px 40px;">

              <!-- Mã vé -->
              <div style="background:#f8faff;border:1.5px dashed #c7d7f5;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
                <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mã vé</div>
                <div style="color:#1a3a8f;font-size:28px;font-weight:800;letter-spacing:2px;margin-top:4px;">#${ticket.id}</div>
              </div>

              <!-- Info grid -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;width:50%;vertical-align:top;">
                    ${infoCell('📅', 'Ngày khởi hành', formatDate(trip?.departureDate ?? ''))}
                  </td>
                  <td style="padding-bottom:12px;padding-left:12px;width:50%;vertical-align:top;">
                    ${infoCell('🕐', 'Giờ khởi hành', schedule?.departureTime ?? '—')}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;vertical-align:top;">
                    ${infoCell('💺', 'Số chỗ', `${ticket.seatCount} chỗ`)}
                  </td>
                  <td style="padding-bottom:12px;padding-left:12px;vertical-align:top;">
                    ${infoCell('🚌', 'Xe', bus ? `${bus.busType} — ${bus.licensePlate}` : '—')}
                  </td>
                </tr>
              </table>

              <!-- Pickup / dropoff -->
              <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:4px 0 24px;">
                <div style="color:#15803d;font-size:12px;font-weight:700;margin-bottom:12px;">📍 ĐIỂM ĐÓN & TRẢ</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:10px;">
                      <span style="display:inline-block;background:#22c55e;color:white;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:10px;font-weight:700;margin-right:8px;">↑</span>
                      <span style="color:#374151;font-size:13px;"><strong>Điểm đón:</strong> ${ticket.pickUpLocation}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="display:inline-block;background:#ef4444;color:white;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:10px;font-weight:700;margin-right:8px;">↓</span>
                      <span style="color:#374151;font-size:13px;"><strong>Điểm trả:</strong> ${ticket.dropOffLocation}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Total price -->
              <div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1.5px solid #fde68a;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Tổng tiền cần thanh toán</div>
                <div style="color:#b45309;font-size:32px;font-weight:800;margin-top:6px;">${formatPrice(Number(ticket.totalPrice))}</div>
              </div>

              <!-- PAYMENT BUTTON -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${paymentPageUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:white;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(249,115,22,0.4);">
                  💳 Thanh toán ngay
                </a>
              </div>

              <!-- Note -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;">
                <p style="color:#991b1b;font-size:12px;margin:0;line-height:1.6;">
                  ⚠️ Vé sẽ tự động bị hủy nếu không thanh toán trong <strong>30 phút</strong>. Vui lòng thanh toán sớm để giữ chỗ.
                </p>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
                Cần hỗ trợ? Liên hệ hotline <strong style="color:#1a3a8f;">1900 0000</strong>
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                © 2026 VinaCoach. Email này được gửi tự động, vui lòng không reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from,
        to: guestEmail,
        subject: `🎫 VinaCoach — Vé xe #${ticket.id} đã được đặt, vui lòng thanh toán`,
        html,
      });
      this.logger.log(`Email đặt vé hộ #${ticket.id} đã gửi tới ${guestEmail}`);
    } catch (err) {
      this.logger.error(`Không thể gửi email đặt vé hộ #${ticket.id}: ${err}`);
    }
  }
}

function infoCell(icon: string, label: string, value: string): string {
  return `
    <div style="background:#f8faff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;">
      <div style="color:#64748b;font-size:11px;font-weight:600;margin-bottom:4px;">${icon} ${label.toUpperCase()}</div>
      <div style="color:#1e293b;font-size:13px;font-weight:600;">${value}</div>
    </div>`;
}
