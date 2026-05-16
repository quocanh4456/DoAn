import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, Route } from '../../entities';
import { ChatMessageDto } from './dto/chat-message.dto';
import { calculateTripBasePrice } from '../../common/utils/pricing.util';

// ─── Intent detection ─────────────────────────────────────────────────────────
type Intent =
  | 'search_trip'   // hỏi chuyến xe cụ thể (điểm đi + điểm đến + ngày)
  | 'list_routes'   // hỏi danh sách tuyến / giá vé
  | 'general';      // câu hỏi chung

interface ParsedQuery {
  intent: Intent;
  origin?: string;
  destination?: string;
  date?: string; // YYYY-MM-DD
}

const TRIP_KEYWORDS = [
  'chuyến', 'xe', 'đi', 'từ', 'đến', 'ngày', 'vé', 'ghế', 'chỗ', 'còn', 'lịch', 'giờ',
  'trip', 'bus', 'seat', 'available', 'schedule',
];
const ROUTE_KEYWORDS = ['tuyến', 'route', 'giá', 'price', 'bao nhiêu', 'danh sách', 'có những'];

function detectIntent(query: string): ParsedQuery {
  const q = query.toLowerCase();

  // Check for route/price listing intent
  if (ROUTE_KEYWORDS.some((k) => q.includes(k)) && !TRIP_KEYWORDS.some((k) => q.includes(k))) {
    return { intent: 'list_routes' };
  }

  // Check for trip search intent
  if (TRIP_KEYWORDS.some((k) => q.includes(k))) {
    // Try to extract date — matches patterns like 14/5, 14-05, ngày 14, tomorrow (ngày mai)
    let date: string | undefined;
    const today = new Date();

    const datePatterns = [
      // DD/MM/YYYY or DD/MM
      /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/,
      // "ngày mai" → tomorrow
      /ngày mai/,
      // "hôm nay"
      /hôm nay/,
    ];

    if (q.includes('ngày mai') || q.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      date = tomorrow.toISOString().slice(0, 10);
    } else if (q.includes('hôm nay') || q.includes('today')) {
      date = today.toISOString().slice(0, 10);
    } else {
      const m = q.match(datePatterns[0]);
      if (m) {
        const day = m[1].padStart(2, '0');
        const month = m[2].padStart(2, '0');
        const year = m[3] || String(today.getFullYear());
        date = `${year}-${month}-${day}`;
      }
    }

    return { intent: 'search_trip', date };
  }

  return { intent: 'general' };
}

// ─── Context formatters ───────────────────────────────────────────────────────
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function formatTripsContext(trips: Trip[]): string {
  if (!trips.length) return 'Hiện tại không có chuyến xe nào phù hợp với yêu cầu tìm kiếm.';

  const lines = trips.map((t) => {
    const route = t.schedule?.route;
    const origin = route?.origin ?? 'N/A';
    const destination = route?.destination ?? 'N/A';
    const time = t.schedule?.departureTime ?? 'N/A';
    const price = route?.basePrice
      ? formatCurrency(calculateTripBasePrice(Number(route.basePrice), t.departureDate))
      : 'Liên hệ';
    return (
      `- Chuyến #${t.id}: ${origin} → ${destination} | ` +
      `Ngày: ${t.departureDate} | Giờ: ${time} | ` +
      `Ghế còn: ${t.availableSeats} | Giá: ${price} | ` +
      `Xe: ${t.bus?.licensePlate ?? 'N/A'} (${t.bus?.busType ?? ''})`
    );
  });

  return `Danh sách chuyến xe phù hợp (${trips.length} chuyến):\n` + lines.join('\n');
}

function formatRoutesContext(routes: Route[]): string {
  if (!routes.length) return 'Hiện tại không có tuyến đường nào đang hoạt động.';

  const lines = routes.map((r) => {
    const price = formatCurrency(Number(r.basePrice));
    return `- Tuyến #${r.id}: ${r.origin} → ${r.destination} | Khoảng cách: ${r.distance} km | Giá cơ bản: ${price}`;
  });

  return `Danh sách tuyến đường đang hoạt động (${routes.length} tuyến):\n` + lines.join('\n');
}

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly difyBaseUrl: string;
  private readonly difyApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Trip) private readonly tripsRepo: Repository<Trip>,
    @InjectRepository(Route) private readonly routesRepo: Repository<Route>,
  ) {
    this.difyBaseUrl =
      this.configService.get<string>('DIFY_BASE_URL') || 'https://api.dify.ai/v1';
    this.difyApiKey = this.configService.get<string>('DIFY_API_KEY') || '';
  }

  // ── Step 1: Fetch real data based on intent ────────────────────────────────
  private async buildContext(query: string): Promise<string> {
    const parsed = detectIntent(query);
    const today = new Date().toISOString().slice(0, 10);

    try {
      if (parsed.intent === 'search_trip') {
        // Query trips: upcoming, with seats, optionally filtered by date
        const qb = this.tripsRepo
          .createQueryBuilder('trip')
          .leftJoinAndSelect('trip.schedule', 'schedule')
          .leftJoinAndSelect('schedule.route', 'route')
          .leftJoinAndSelect('trip.bus', 'bus')
          .where('trip.status = :status', { status: 'SCHEDULED' })
          .andWhere('trip.availableSeats > 0')
          .andWhere(
            '(trip.departureDate > :today OR (trip.departureDate = :today AND schedule.departureTime >= CURTIME()))',
            { today },
          )
          .orderBy('trip.departureDate', 'ASC')
          .addOrderBy('schedule.departureTime', 'ASC')
          .limit(10);

        if (parsed.date) {
          qb.andWhere('trip.departureDate = :date', { date: parsed.date });
        }

        const trips = await qb.getMany();
        return formatTripsContext(trips);
      }

      if (parsed.intent === 'list_routes') {
        const routes = await this.routesRepo.find({
          where: { isActive: true },
          order: { origin: 'ASC' },
        });
        return formatRoutesContext(routes);
      }

      // General: provide a brief overview of available routes
      const routes = await this.routesRepo.find({ where: { isActive: true } });
      if (!routes.length) return '';

      const routeSummary = routes
        .map((r) => `${r.origin} → ${r.destination} (giá từ ${formatCurrency(Number(r.basePrice))})`)
        .join(', ');
      return `VinaCoach hiện đang khai thác các tuyến: ${routeSummary}.`;
    } catch (err) {
      this.logger.warn('Could not fetch DB context for chatbot', err);
      return '';
    }
  }

  // ── Step 2: Send enriched message to Dify ─────────────────────────────────
  async sendMessage(dto: ChatMessageDto): Promise<any> {
    const { query, conversation_id, user } = dto;

    // Build live data context from DB
    const dbContext = await this.buildContext(query);

    const systemNote = `
Bạn là trợ lý ảo thông minh của VinaCoach — hệ thống đặt vé xe khách trực tuyến chất lượng cao tại Việt Nam.
Nhiệm vụ của bạn: trả lời câu hỏi của hành khách dựa trên DỮ LIỆU THỰC TẾ bên dưới.
Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn và chính xác.
Nếu không có dữ liệu phù hợp, hãy gợi ý khách gọi hotline 1900 0000.

=== DỮ LIỆU HỆ THỐNG (cập nhật theo thời gian thực) ===
${dbContext || 'Không có dữ liệu đặc biệt cho câu hỏi này.'}
=== KẾT THÚC DỮ LIỆU ===
`.trim();

    const enrichedQuery = dbContext
      ? `${query}\n\n[Ngữ cảnh hệ thống: ${systemNote}]`
      : query;

    const payload = {
      inputs: {
        // Pass context as a named variable — configure this in Dify app's "inputs" if needed
        context: systemNote,
      },
      query: enrichedQuery,
      response_mode: 'blocking',
      conversation_id: conversation_id || '',
      user: user || 'vinacoach-guest',
    };

    this.logger.log(
      `Sending to Dify | intent: ${detectIntent(query).intent} | context_len: ${dbContext.length}`,
    );

    try {
      const response = await fetch(`${this.difyBaseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.difyApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Dify API error ${response.status}: ${errorText}`);
        throw new HttpException(
          `Dify API responded with status ${response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      this.logger.log(`Dify responded. Conversation ID: ${data.conversation_id}`);

      return {
        answer: data.answer,
        conversation_id: data.conversation_id,
        message_id: data.id,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to call Dify API', error);
      throw new HttpException(
        'Không thể kết nối tới dịch vụ chatbot. Vui lòng thử lại sau.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
