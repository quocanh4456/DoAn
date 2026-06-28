import { useState, useEffect, Fragment } from 'react';
import { ticketService } from '@/services/ticket.service';
import { paymentService } from '@/services/payment.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  MapPin,
  Clock,
  ArrowRight,
  Bus,
  User,
  Hash,
  Calendar,
  CreditCard,
  ChevronDown,
  Route,
  Armchair,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Ticket as TicketType } from '@/types';

const statusMap: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    icon: React.ElementType;
    color: string;
  }
> = {
  PENDING: {
    label: 'Chờ thanh toán',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-50',
    icon: Timer,
    color: '#f97316',
  },
  CONFIRMED: {
    label: 'Đã thanh toán',
    variant: 'default',
    className: 'bg-emerald-500 text-white border-emerald-500',
    icon: CheckCircle2,
    color: '#10b981',
  },
  CANCELLED: {
    label: 'Đã hủy',
    variant: 'destructive',
    className: '',
    icon: XCircle,
    color: '#ef4444',
  },
  EXPIRED: {
    label: 'Hết hạn',
    variant: 'secondary',
    className: '',
    icon: AlertCircle,
    color: '#6b7280',
  },
};

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const fetchTickets = async () => {
    try {
      const { data } = await ticketService.getMyTickets();
      setTickets(data);
    } catch {
      toast.error('Không thể tải danh sách vé');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCancel = async (id: number) => {
    setSubmittingId(id);
    try {
      await ticketService.cancel(id);
      toast.success('Đã hủy vé thành công');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Không thể hủy vé',
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePayment = async (id: number) => {
    setSubmittingId(id);
    try {
      const { data } = await paymentService.createPayOSUrl(id);
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      const message = err?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Không thể tạo liên kết thanh toán',
      );
      setSubmittingId(null);
    }
  };

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

  const formatCreatedAt = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Ticket className="h-8 w-8 text-primary/50" />
        </div>
        Đang tải...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        Vé của tôi
      </h1>

      {tickets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-10 w-10 text-primary/30" />
          </div>
          <p className="text-lg font-medium mb-1">Chưa có vé nào</p>
          <p className="text-sm">
            Hãy tìm và đặt chuyến xe đầu tiên của bạn
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const st = statusMap[t.status] || statusMap.PENDING;
            return (
              <Card
                key={t.id}
                className="hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedTicket(t)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        {t.trip?.schedule?.route?.origin}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        {t.trip?.schedule?.route?.destination}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {t.trip?.schedule?.departureTime} -{' '}
                          {t.trip?.departureDate}
                        </span>
                        <span className="bg-muted px-2.5 py-1 rounded-md">
                          Số chỗ:{' '}
                          <span className="font-medium text-foreground">
                            {t.seatCount}
                          </span>
                        </span>
                        <span className="bg-muted px-2.5 py-1 rounded-md">
                          Mã vé:{' '}
                          <span className="font-medium text-foreground">
                            #{t.id}
                          </span>
                        </span>
                      </div>
                      <div className="text-sm mt-2 text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-green-500" />
                        {t.pickUpLocation}
                        <span className="mx-1">→</span>
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        {t.dropOffLocation}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 relative z-10 shrink-0">
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(Number(t.totalPrice))}
                      </div>
                      <Badge variant={st.variant} className={`${st.className} flex items-center gap-1`}>
                        <st.icon className="h-3 w-3" />
                        {st.label}
                      </Badge>
                      {t.status === 'PENDING' && (
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayment(t.id);
                            }}
                            disabled={submittingId === t.id}
                            className="relative z-20 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1a3a8f] text-white hover:bg-[#1a3a8f]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            Thanh toán
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(t.id);
                            }}
                            disabled={submittingId === t.id}
                            className="relative z-20 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            Hủy vé
                          </button>
                        </div>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onPayment={handlePayment}
          onCancel={handleCancel}
          submittingId={submittingId}
          formatPrice={formatPrice}
          formatDate={formatDate}
          formatCreatedAt={formatCreatedAt}
        />
      )}
    </div>
  );
}

/* ─── Ticket Detail Modal Component ─────────────────── */

interface TicketDetailModalProps {
  ticket: TicketType;
  onClose: () => void;
  onPayment: (id: number) => void;
  onCancel: (id: number) => void;
  submittingId: number | null;
  formatPrice: (price: number) => string;
  formatDate: (dateStr: string) => string;
  formatCreatedAt: (dateStr: string) => string;
}

function TicketDetailModal({
  ticket: t,
  onClose,
  onPayment,
  onCancel,
  submittingId,
  formatPrice,
  formatDate,
  formatCreatedAt,
}: TicketDetailModalProps) {
  const st = statusMap[t.status] || statusMap.PENDING;
  const StatusIcon = st.icon;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        <div className="relative bg-gradient-to-r from-[#1a3a8f] to-[#2a5bd7] text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">Chi tiết vé xe</h2>
              <p className="text-white/70 text-sm">Mã vé: #{t.id}</p>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mr-8"
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: '#fff',
              }}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {st.label}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 text-right">
              <p className="text-base font-bold leading-tight">
                {t.trip?.schedule?.route?.origin}
              </p>
              <p className="text-white/55 text-[11px] mt-0.5">Điểm đi</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <div className="w-14 h-px bg-white/30 relative">
                  <div className="absolute inset-0 bg-white/70" style={{ width: '55%' }} />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-orange-300" />
                <div className="w-2 h-2 rounded-full bg-orange-400" />
              </div>
              {t.trip?.schedule?.route?.distance ? (
                <span className="text-[10px] text-white/50 flex items-center gap-0.5">
                  <Route className="h-2.5 w-2.5" />
                  {t.trip.schedule.route.distance} km
                </span>
              ) : null}
            </div>
            <div className="flex-1">
              <p className="text-base font-bold leading-tight">
                {t.trip?.schedule?.route?.destination}
              </p>
              <p className="text-white/55 text-[11px] mt-0.5">Điểm đến</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <InfoItem
              icon={Calendar}
              label="Ngày khởi hành"
              value={formatDate(t.trip?.departureDate || '')}
              iconColor="#3b82f6"
            />
            <InfoItem
              icon={Clock}
              label="Giờ khởi hành"
              value={t.trip?.schedule?.departureTime || '—'}
              iconColor="#8b5cf6"
            />
            <InfoItem
              icon={User}
              label="Tài xế"
              value={t.trip?.driverName || '—'}
              iconColor="#f59e0b"
            />
            <InfoItem
              icon={Bus}
              label="Xe"
              value={
                t.trip?.bus
                  ? `${t.trip.bus.busType} — ${t.trip.bus.licensePlate}`
                  : '—'
              }
              iconColor="#10b981"
            />
            <InfoItem
              icon={Armchair}
              label="Số chỗ ngồi"
              value={`${t.seatCount} chỗ`}
              iconColor="#6366f1"
            />
            <InfoItem
              icon={Hash}
              label="Tổng số ghế trên xe"
              value={
                t.trip?.bus ? `${t.trip.bus.totalSeats} ghế` : '—'
              }
              iconColor="#ec4899"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Điểm đón & trả
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Điểm đón</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {t.pickUpLocation}
                  </p>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-dashed border-gray-300 h-4" />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Điểm trả</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {t.dropOffLocation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    Tổng tiền
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(Number(t.totalPrice))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">
                  Thời gian đặt vé
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCreatedAt(t.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {t.status === 'PENDING' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onPayment(t.id)}
                disabled={submittingId === t.id}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-[#1a3a8f] text-white hover:bg-[#1a3a8f]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-lg shadow-[#1a3a8f]/20"
              >
                <CreditCard className="h-4 w-4" />
                Thanh toán ngay
              </button>
              <button
                type="button"
                onClick={() => onCancel(t.id)}
                disabled={submittingId === t.id}
                className="px-5 py-3 text-sm font-semibold rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Hủy vé
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Info Item Helper ──────────────────────────────── */

function InfoItem({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconColor + '15' }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
