import { Injectable, Logger, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, Route } from '../../entities';
import { ChatMessageDto } from './dto/chat-message.dto';
import { calculateTripBasePrice } from '../../common/utils/pricing.util';
import { TicketsService } from '../tickets/tickets.service';
import { PaymentsService } from '../payments/payments.service';

// ─── Intent types ───────────────────────────────────────────────────────────

type Intent =
  | 'search_trip'
  | 'list_routes'
  | 'book_ticket'
  | 'confirm_booking'
  | 'general';

interface ParsedQuery {
  intent: Intent;
  origin?: string;
  destination?: string;
  date?: string;
  seatCount?: number;
  tripId?: number;
}

// ─── Keywords ───────────────────────────────────────────────────────────────

const TRIP_KEYWORDS = [
  'chuyến', 'xe', 'đi', 'từ', 'đến', 'ngày', 'vé', 'ghế', 'chỗ', 'còn', 'lịch', 'giờ',
  'trip', 'bus', 'seat', 'available', 'schedule',
];
const ROUTE_KEYWORDS = ['tuyến', 'route', 'giá', 'price', 'bao nhiêu', 'danh sách', 'có những'];
const BOOK_KEYWORDS = ['đặt vé', 'đặt cho', 'mua vé', 'book', 'giữ chỗ', 'đặt giúp', 'đặt hộ', 'đặt ngay', 'mua cho'];
const CONFIRM_KEYWORDS = ['chọn chuyến', 'chọn số', 'xác nhận', 'đặt chuyến', 'chọn #'];

/** Regex patterns bắt các biến thể: "đặt 1 vé", "muốn đi X tới Y", "mua 3 vé"... */
const BOOK_REGEX_PATTERNS = [
  /đặt\s+\d*\s*vé/,
  /mua\s+\d*\s*vé/,
  /đặt\s+(?:cho|giúp|hộ)/,
  /book\s*(?:vé|ticket)?/,
  /giữ\s*chỗ/,
  /đặt\s*ngay/,
  /muốn\s+(?:đi|đến|tới|về)/,
  /cần\s+(?:đi|đến|tới|về)/,
  /cho\s+(?:tôi|mình|em)\s+(?:đi|đến)/,
];

// ─── City abbreviation mapping ──────────────────────────────────────────────

const CITY_ALIASES: Record<string, string[]> = {
  'TP.HCM': ['hcm', 'hồ chí minh', 'sài gòn', 'sg', 'saigon', 'tp.hcm', 'tphcm', 'tp hcm'],
  'Hà Nội': ['hà nội', 'hn', 'hanoi', 'ha noi'],
  'Đà Lạt': ['đà lạt', 'dl', 'da lat', 'dalat', 'đà lạt'],
  'Đà Nẵng': ['đà nẵng', 'đn', 'dn', 'da nang', 'danang'],
  'Nha Trang': ['nha trang', 'nt'],
  'Vũng Tàu': ['vũng tàu', 'vt', 'vung tau'],
  'Cần Thơ': ['cần thơ', 'ct', 'can tho'],
  'Buôn Ma Thuột': ['buôn ma thuột', 'bmt', 'buon ma thuot', 'đắk lắk', 'dak lak'],
  'Phan Thiết': ['phan thiết', 'pt', 'phan thiet', 'bình thuận', 'binh thuan'],
  'Huế': ['huế', 'hue'],
  'Quy Nhơn': ['quy nhơn', 'qn', 'quy nhon', 'bình định', 'binh dinh'],
  'Phú Quốc': ['phú quốc', 'pq', 'phu quoc'],
  'Mũi Né': ['mũi né', 'mn', 'mui ne'],
  'Long Xuyên': ['long xuyên', 'lx', 'long xuyen', 'an giang'],
  'Rạch Giá': ['rạch giá', 'rg', 'rach gia', 'kiên giang'],
  'Cà Mau': ['cà mau', 'cm', 'ca mau'],
  'Tây Ninh': ['tây ninh', 'tn', 'tay ninh'],
  'Biên Hòa': ['biên hòa', 'bh', 'bien hoa', 'đồng nai'],
  'Bình Dương': ['bình dương', 'bd', 'binh duong'],
};

// ─── Helper: Resolve city alias ─────────────────────────────────────────────

/** Những từ phổ biến KHÔNG phải tên thành phố — tránh parse nhầm */
const STOPWORDS = new Set([
  'vé', 'xe', 'cho', 'tôi', 'tui', 'mình', 'em', 'anh', 'chị',
  'cái', 'chiếc', 'một', 'hai', 'ba', 'bốn', 'năm',
  'đặt', 'mua', 'book', 'giữ', 'lấy', 'cần', 'muốn', 'xin',
  'giúp', 'hộ', 'ngay', 'luôn', 'liền', 'nha', 'nhé', 'ạ',
  'đi', 'đến', 'tới', 'về', 'qua', 'từ', 'lên', 'xuống',
  'ngày', 'hôm', 'mai', 'nay', 'kia', 'mốt', 'tối', 'sáng', 'chiều',
  'chỗ', 'ghế', 'giá', 'tiền', 'người', 'khách',
]);

function resolveCity(input: string): string | undefined {
  if (!input) return undefined;
  const normalized = input.toLowerCase().trim();

  // Bỏ qua stopword
  if (STOPWORDS.has(normalized)) return undefined;

  // Tìm trong danh sách alias
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some((a) => normalized.includes(a))) {
      return city;
    }
  }

  // Nếu không match alias nào và quá ngắn (< 3 ký tự) → không phải tên thành phố
  if (normalized.length < 3) return undefined;

  // Nếu chứa nhiều từ stopword → không phải tên thành phố
  const words = normalized.split(/\s+/);
  const nonStopwords = words.filter((w) => !STOPWORDS.has(w));
  if (nonStopwords.length === 0) return undefined;

  // Return original input capitalized if no alias matched (có thể là tên thành phố mới)
  return input.charAt(0).toUpperCase() + input.slice(1);
}

// ─── Helper: Parse date from Vietnamese text ────────────────────────────────

function parseDate(query: string): string | undefined {
  const q = query.toLowerCase();
  const today = new Date();

  if (q.includes('ngày mai') || q.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }
  if (q.includes('hôm nay') || q.includes('today')) {
    return today.toISOString().slice(0, 10);
  }
  if (q.includes('ngày kia') || q.includes('ngày mốt')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }

  // ISO format: yyyy-mm-dd (e.g., 2026-07-04, 2026-7-4)
  const isoMatch = q.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Vietnamese: "ngày X tháng Y" (e.g., ngày 4 tháng 7)
  const vnMatch = q.match(/ngày\s+(\d{1,2})\s*(?:tháng|\/)\s*(\d{1,2})/);
  if (vnMatch) {
    const day = vnMatch[1].padStart(2, '0');
    const month = vnMatch[2].padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  // dd/mm/yyyy (e.g., 04/07/2026)
  const fullDateMatch = q.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (fullDateMatch) {
    const day = fullDateMatch[1].padStart(2, '0');
    const month = fullDateMatch[2].padStart(2, '0');
    const year = fullDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // dd/mm (e.g., 4/7, 04/07) — năm mặc định là năm nay
  const shortDateMatch = q.match(/(\d{1,2})[\/](\d{1,2})(?!\d)/);
  if (shortDateMatch) {
    const day = shortDateMatch[1].padStart(2, '0');
    const month = shortDateMatch[2].padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  return undefined;
}

// ─── Helper: Parse seat count ───────────────────────────────────────────────

function parseSeatCount(query: string): number {
  const q = query.toLowerCase();
  const match = q.match(/(\d+)\s*(?:vé|chỗ|ghế|người|seat|ticket)/);
  if (match) return Math.min(Math.max(parseInt(match[1], 10), 1), 10);
  return 1;
}

// ─── Helper: Extract origin/destination from booking query ──────────────────

function extractCities(query: string): { origin?: string; destination?: string } {
  const q = query.toLowerCase();

  // Pattern: "từ X đi/đến Y" or "X đi/đến Y" or "X - Y" or "X qua Y"
  const patterns = [
    /từ\s+(.+?)\s+(?:đi|đến|tới|qua|→|->)\s+(.+?)(?:\s+ngày|\s+hôm|\s+\d|$)/,
    /(?:đặt|mua|book).+?(?:từ\s+)?(.+?)\s+(?:đi|đến|tới|qua|→|->)\s+(.+?)(?:\s+ngày|\s+hôm|\s+\d|$)/,
    /(.+?)\s+(?:đi|đến|tới|qua|→|->)\s+(.+?)(?:\s+ngày|\s+hôm|\s+\d|$)/,
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match) {
      const origin = resolveCity(match[1].trim());
      const destination = resolveCity(match[2].trim());
      if (origin && destination) {
        return { origin, destination };
      }
      // Nếu chỉ có destination (origin bị filter bởi stopword) → trả partial
      if (destination && !origin) {
        return { destination };
      }
    }
  }

  // Fallback: chỉ có "đi/đến X" — không có origin
  const destOnlyMatch = q.match(/(?:đi|đến|tới|lên|về|qua)\s+(.+?)(?:\s+ngày|\s+hôm|\s+\d|$)/);
  if (destOnlyMatch) {
    const destination = resolveCity(destOnlyMatch[1].trim());
    if (destination) {
      return { destination };
    }
  }

  return {};
}

// ─── Helper: Parse tripId from confirm message ──────────────────────────────

function parseTripId(query: string): number | undefined {
  // "chọn chuyến #5", "đặt chuyến 5", "chọn số 2", "chuyến #12"
  const match = query.match(/(?:chọn|đặt|book)\s*(?:chuyến|số|#)\s*#?(\d+)/i);
  if (match) return parseInt(match[1], 10);

  // Just a number as a reply
  const numMatch = query.trim().match(/^#?(\d+)$/);
  if (numMatch) return parseInt(numMatch[1], 10);

  return undefined;
}

// ─── Intent detection ───────────────────────────────────────────────────────

function detectIntent(query: string): ParsedQuery {
  const q = query.toLowerCase();

  // Check confirm first (shortest messages like "1", "chọn chuyến 3")
  const tripId = parseTripId(query);
  if (CONFIRM_KEYWORDS.some((k) => q.includes(k)) || (tripId && q.length < 30)) {
    return { intent: 'confirm_booking', tripId };
  }

  // Check booking intent — dùng cả keyword lẫn regex để bắt nhiều biến thể
  const isBooking = BOOK_KEYWORDS.some((k) => q.includes(k)) || BOOK_REGEX_PATTERNS.some((r) => r.test(q));
  if (isBooking) {
    const { origin, destination } = extractCities(query);
    const date = parseDate(query);
    const seatCount = parseSeatCount(query);
    return { intent: 'book_ticket', origin, destination, date, seatCount };
  }

  // Route listing
  if (ROUTE_KEYWORDS.some((k) => q.includes(k)) && !TRIP_KEYWORDS.some((k) => q.includes(k))) {
    return { intent: 'list_routes' };
  }

  // Trip search — cũng extract origin/destination để lọc DB chính xác
  if (TRIP_KEYWORDS.some((k) => q.includes(k))) {
    const { origin, destination } = extractCities(query);
    const date = parseDate(query);
    return { intent: 'search_trip', origin, destination, date };
  }

  return { intent: 'general' };
}

// ─── Format helpers ─────────────────────────────────────────────────────────

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

function formatTripsForBooking(trips: Trip[]): string {
  if (!trips.length) return 'Không tìm thấy chuyến xe phù hợp.';

  const lines = trips.map((t, idx) => {
    const route = t.schedule?.route;
    const price = route?.basePrice
      ? formatCurrency(calculateTripBasePrice(Number(route.basePrice), t.departureDate))
      : 'Liên hệ';
    return (
      `${idx + 1}. Chuyến #${t.id}: ${route?.origin} → ${route?.destination} | ` +
      `Ngày: ${t.departureDate} | Giờ: ${t.schedule?.departureTime} | ` +
      `Ghế còn: ${t.availableSeats} | Giá: ${price}`
    );
  });

  return (
    `Tìm thấy ${trips.length} chuyến xe phù hợp:\n` +
    lines.join('\n') +
    '\n\nHãy cho tôi biết bạn muốn đặt chuyến nào bằng cách nhắn số thứ tự hoặc mã chuyến (ví dụ: "chọn chuyến #1").'
  );
}

// ─── Booking session (in-memory, per conversation) ──────────────────────────

interface BookingSession {
  trips: Trip[];
  seatCount: number;
  createdAt: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly difyBaseUrl: string;
  private readonly difyApiKey: string;

  /** Lưu tạm danh sách chuyến đã tìm để user chọn (key = conversation_id hoặc user) */
  private bookingSessions = new Map<string, BookingSession>();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Trip) private readonly tripsRepo: Repository<Trip>,
    @InjectRepository(Route) private readonly routesRepo: Repository<Route>,
    @Inject(forwardRef(() => TicketsService))
    private readonly ticketsService: TicketsService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {
    this.difyBaseUrl =
      this.configService.get<string>('DIFY_BASE_URL') || 'https://api.dify.ai/v1';
    this.difyApiKey = this.configService.get<string>('DIFY_API_KEY') || '';
  }

  // ─── Session helpers ────────────────────────────────────────────────────

  private getSessionKey(dto: ChatMessageDto): string {
    return dto.conversation_id || dto.user || 'anonymous';
  }

  private cleanExpiredSessions() {
    const now = Date.now();
    for (const [key, session] of this.bookingSessions) {
      if (now - session.createdAt > 10 * 60 * 1000) {
        this.bookingSessions.delete(key);
      }
    }
  }

  /** Lấy tất cả alias tìm kiếm cho 1 thành phố (bao gồm cả key) */
  private getCitySearchTerms(city: string): string[] {
    const terms: string[] = [city];
    for (const [key, aliases] of Object.entries(CITY_ALIASES)) {
      if (key === city) {
        terms.push(...aliases);
        break;
      }
    }
    return [...new Set(terms)];
  }

  private async searchTripsForBooking(
    origin?: string,
    destination?: string,
    date?: string,
  ): Promise<Trip[]> {
    const today = new Date().toISOString().slice(0, 10);

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
      .limit(5);

    if (origin) {
      const originTerms = this.getCitySearchTerms(origin);
      const originConditions = originTerms.map((_, i) => `route.origin LIKE :o${i}`);
      const originParams: Record<string, string> = {};
      originTerms.forEach((t, i) => { originParams[`o${i}`] = `%${t}%`; });
      qb.andWhere(`(${originConditions.join(' OR ')})`, originParams);
    }
    if (destination) {
      const destTerms = this.getCitySearchTerms(destination);
      const destConditions = destTerms.map((_, i) => `route.destination LIKE :d${i}`);
      const destParams: Record<string, string> = {};
      destTerms.forEach((t, i) => { destParams[`d${i}`] = `%${t}%`; });
      qb.andWhere(`(${destConditions.join(' OR ')})`, destParams);
    }
    if (date) {
      qb.andWhere('trip.departureDate = :date', { date });
    }

    return qb.getMany();
  }

  // ─── Handle booking flow ────────────────────────────────────────────────

  private async handleBooking(
    parsed: ParsedQuery,
    dto: ChatMessageDto,
  ): Promise<string> {
    const { origin, destination, date, seatCount = 1 } = parsed;

    if (!origin || !destination) {
      // Có điểm đến nhưng thiếu điểm đi
      if (destination && !origin) {
        return (
          `Bạn muốn đi **${destination}**, tuyệt vời! 🎯\n\n` +
          `Vui lòng cho tôi biết thêm:\n` +
          `- **Điểm đi** của bạn là ở đâu?\n` +
          `- **Ngày đi** (VD: ngày mai, 15/07)\n\n` +
          `Ví dụ: *"Đặt 1 vé HCM đi ${destination} ngày mai"*`
        );
      }
      // Có điểm đi nhưng thiếu điểm đến
      if (origin && !destination) {
        return (
          `Bạn muốn đi từ **${origin}**, vui lòng cho tôi biết:\n` +
          `- **Điểm đến** bạn muốn tới?\n\n` +
          `Ví dụ: *"Đặt 1 vé ${origin} đi Đà Lạt ngày mai"*`
        );
      }
      // Thiếu cả hai
      return (
        'Để đặt vé, bạn cần cho tôi biết:\n' +
        '- **Điểm đi** và **điểm đến** (VD: HCM đi Đà Lạt)\n' +
        '- **Ngày đi** (VD: ngày mai, 15/07)\n' +
        '- **Số vé** (VD: 2 vé)\n\n' +
        'Ví dụ: *"Đặt 2 vé HCM đi Đà Lạt ngày mai"*'
      );
    }

    const trips = await this.searchTripsForBooking(origin, destination, date);

    if (!trips.length) {
      const dateNote = date ? ` ngày ${date}` : '';
      return (
        `Xin lỗi, hiện không có chuyến xe nào từ **${origin}** đến **${destination}**${dateNote} còn ghế trống.\n\n` +
        'Bạn có thể:\n' +
        '- Thử tìm ngày khác\n' +
        '- Liên hệ hotline **1900 0000** để được hỗ trợ'
      );
    }

    if (trips.length === 1) {
      // Chỉ 1 chuyến → đặt luôn
      return this.executeBooking(trips[0], seatCount, dto);
    }

    // Nhiều chuyến → lưu session, hỏi user chọn
    const sessionKey = this.getSessionKey(dto);
    this.bookingSessions.set(sessionKey, {
      trips,
      seatCount,
      createdAt: Date.now(),
    });

    return formatTripsForBooking(trips);
  }

  // ─── Handle confirm booking (user chọn chuyến) ─────────────────────────

  private async handleConfirmBooking(
    parsed: ParsedQuery,
    dto: ChatMessageDto,
  ): Promise<string | null> {
    this.cleanExpiredSessions();
    const sessionKey = this.getSessionKey(dto);
    const session = this.bookingSessions.get(sessionKey);

    if (!session) {
      return null; // Không có session → xử lý như general
    }

    let selectedTrip: Trip | undefined;

    if (parsed.tripId) {
      // User nhập mã chuyến (tripId)
      selectedTrip = session.trips.find((t) => t.id === parsed.tripId);

      // Hoặc user nhập số thứ tự (1, 2, 3...)
      if (!selectedTrip && parsed.tripId <= session.trips.length) {
        selectedTrip = session.trips[parsed.tripId - 1];
      }
    }

    if (!selectedTrip) {
      return (
        'Tôi không tìm thấy chuyến bạn chọn. Vui lòng nhắn lại số thứ tự hoặc mã chuyến.\n' +
        'Ví dụ: *"chọn chuyến #1"* hoặc nhắn *"1"*'
      );
    }

    this.bookingSessions.delete(sessionKey);
    return this.executeBooking(selectedTrip, session.seatCount, dto);
  }

  // ─── Execute booking (tạo vé + link thanh toán) ─────────────────────────

  private async executeBooking(
    trip: Trip,
    seatCount: number,
    dto: ChatMessageDto,
  ): Promise<string> {
    const route = trip.schedule?.route;
    const origin = route?.origin ?? '';
    const dest = route?.destination ?? '';
    const userId = dto.userId;

    if (!userId) {
      // Guest user — không đặt vé được, hướng dẫn đăng nhập
      const price = route?.basePrice
        ? formatCurrency(calculateTripBasePrice(Number(route.basePrice), trip.departureDate) * seatCount)
        : 'Liên hệ';

      return (
        `Tôi tìm được chuyến xe phù hợp:\n\n` +
        `🚌 **Chuyến #${trip.id}**: ${origin} → ${dest}\n` +
        `📅 Ngày: ${trip.departureDate} | 🕐 Giờ: ${trip.schedule?.departureTime}\n` +
        `💺 Ghế còn: ${trip.availableSeats} | 💰 Tổng tiền: ${price}\n\n` +
        `⚠️ Để đặt vé qua chatbot, bạn cần **đăng nhập** trước.\n` +
        `Bạn có thể đăng nhập rồi nhắn lại, hoặc đặt vé trực tiếp trên website tại trang tìm chuyến.`
      );
    }

    try {
      // Tạo vé
      const ticket = await this.ticketsService.create(
        {
          tripId: trip.id,
          seatCount,
          pickUpLocation: origin,
          dropOffLocation: dest,
        },
        userId,
      );

      // Tạo link thanh toán
      let paymentUrl = '';
      try {
        const paymentResult = await this.paymentsService.createPayOSUrl(ticket.id);
        paymentUrl = paymentResult.paymentUrl;
      } catch (e) {
        this.logger.warn(`Could not create payment URL for ticket #${ticket.id}`, e);
      }

      const price = formatCurrency(Number(ticket.totalPrice));
      const expiresMin = Math.floor((ticket.expiresIn || 600) / 60);

      let response =
        `✅ **Đặt vé thành công!**\n\n` +
        `🎫 Mã vé: **#${ticket.id}**\n` +
        `🚌 Chuyến: ${origin} → ${dest}\n` +
        `📅 Ngày: ${trip.departureDate} | 🕐 Giờ: ${trip.schedule?.departureTime}\n` +
        `💺 Số ghế: ${seatCount}\n` +
        `💰 Tổng tiền: **${price}**\n` +
        `⏳ Hạn thanh toán: **${expiresMin} phút**\n`;

      if (paymentUrl) {
        response += `\n💳 **Thanh toán ngay:** [Nhấn vào đây](${paymentUrl})`;
      }

      response += `\n\n⚠️ Vé sẽ tự động hủy nếu không thanh toán trong ${expiresMin} phút.`;

      return response;
    } catch (error: any) {
      this.logger.error(`Booking failed for trip #${trip.id}`, error);
      return (
        `❌ Không thể đặt vé: **${error.message || 'Lỗi hệ thống'}**\n\n` +
        'Vui lòng thử lại hoặc liên hệ hotline **1900 0000**.'
      );
    }
  }

  // ─── Build context (existing logic + booking) ───────────────────────────

  private async buildContext(query: string, parsed: ParsedQuery): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);

    try {
      if (parsed.intent === 'search_trip') {
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

        // Lọc theo origin/destination nếu có
        if (parsed.origin) {
          const originTerms = this.getCitySearchTerms(parsed.origin);
          const oConds = originTerms.map((_, i) => `route.origin LIKE :so${i}`);
          const oParams: Record<string, string> = {};
          originTerms.forEach((t, i) => { oParams[`so${i}`] = `%${t}%`; });
          qb.andWhere(`(${oConds.join(' OR ')})`, oParams);
        }
        if (parsed.destination) {
          const destTerms = this.getCitySearchTerms(parsed.destination);
          const dConds = destTerms.map((_, i) => `route.destination LIKE :sd${i}`);
          const dParams: Record<string, string> = {};
          destTerms.forEach((t, i) => { dParams[`sd${i}`] = `%${t}%`; });
          qb.andWhere(`(${dConds.join(' OR ')})`, dParams);
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

  // ─── Main entry point ──────────────────────────────────────────────────

  async sendMessage(dto: ChatMessageDto): Promise<any> {
    const { query, conversation_id, user } = dto;
    const parsed = detectIntent(query);

    this.logger.log(
      `Chatbot | intent: ${parsed.intent} | userId: ${dto.userId} (type: ${typeof dto.userId}) | query: "${query.slice(0, 80)}"`,
    );

    // ── Handle booking intents locally (không cần gửi lên Dify) ──────────

    if (parsed.intent === 'book_ticket') {
      const bookingResult = await this.handleBooking(parsed, dto);
      return {
        answer: bookingResult,
        conversation_id: conversation_id || '',
        message_id: `booking-${Date.now()}`,
      };
    }

    if (parsed.intent === 'confirm_booking') {
      const confirmResult = await this.handleConfirmBooking(parsed, dto);
      if (confirmResult) {
        return {
          answer: confirmResult,
          conversation_id: conversation_id || '',
          message_id: `confirm-${Date.now()}`,
        };
      }
      // Fall through to Dify if no active session
    }

    // ── Handle search/general intents via Dify AI ────────────────────────

    const dbContext = await this.buildContext(query, parsed);

    const systemNote = `
Bạn là trợ lý ảo thông minh của VinaCoach — hệ thống đặt vé xe khách trực tuyến chất lượng cao tại Việt Nam.
Nhiệm vụ của bạn: trả lời câu hỏi của hành khách dựa trên DỮ LIỆU THỰC TẾ bên dưới.
Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn và chính xác.
Nếu không có dữ liệu phù hợp, hãy gợi ý khách gọi hotline 1900 0000.

QUAN TRỌNG — QUY TẮC BẮT BUỘC:
- TUYỆT ĐỐI KHÔNG được nói "đã đặt vé thành công" hoặc giả vờ đặt vé. Bạn KHÔNG CÓ khả năng đặt vé.
- Nếu khách muốn đặt vé, hãy hướng dẫn họ nhắn ĐÚNG theo mẫu: "Đặt [số] vé [điểm đi] đi [điểm đến] [ngày]".
- Ví dụ: "Đặt 2 vé HCM đi Đà Lạt ngày mai" hoặc "Đặt 1 vé Hà Nội đi Đà Nẵng 15/07".
- Chỉ trả lời thông tin tra cứu, KHÔNG bịa thông tin đặt vé.

=== DỮ LIỆU HỆ THỐNG (cập nhật theo thời gian thực) ===
${dbContext || 'Không có dữ liệu đặc biệt cho câu hỏi này.'}
=== KẾT THÚC DỮ LIỆU ===
`.trim();

    const enrichedQuery = dbContext
      ? `${query}\n\n[Ngữ cảnh hệ thống: ${systemNote}]`
      : query;

    const payload = {
      inputs: {
        context: systemNote,
      },
      query: enrichedQuery,
      response_mode: 'blocking',
      conversation_id: conversation_id || '',
      user: user || 'vinacoach-guest',
    };

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
