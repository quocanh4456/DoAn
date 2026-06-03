import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ticketService } from '@/services/ticket.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bus, MapPin, Clock, CreditCard, ArrowRight, Timer, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Ticket } from '@/types';

export function GuestPaymentPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticketId && email) {
      ticketService
        .getGuestTicket(Number(ticketId), email)
        .then(({ data }) => {
          setTicket(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Không thể tải thông tin vé');
          setLoading(false);
        });
    } else {
      setError('Thiếu thông tin vé hoặc email');
      setLoading(false);
    }
  }, [ticketId, email]);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price),
    [],
  );

  const handlePayment = async () => {
    if (!ticket) return;
    setPaying(true);
    try {
      const { data } = await ticketService.createGuestPayment(ticket.id, email);
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo liên kết thanh toán');
      setPaying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bus className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-gray-500">Đang tải thông tin vé...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể truy cập</h2>
            <p className="text-gray-500 text-sm">{error || 'Vé không tồn tại hoặc email không khớp'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const origin = ticket.trip?.schedule?.route?.origin ?? '';
  const destination = ticket.trip?.schedule?.route?.destination ?? '';
  const isPending = ticket.status === 'PENDING';
  const isConfirmed = ticket.status === 'CONFIRMED';
  const isExpired = ticket.status === 'EXPIRED' || ticket.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2461] via-[#1a3a8f] to-gray-100">
      {/* Header */}
      <div className="text-center pt-10 pb-8 px-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-2xl font-extrabold tracking-tight">
            Vina<span className="text-orange-400">Coach</span>
          </span>
        </div>
        <h1 className="text-white text-xl font-bold">Thanh toán vé xe</h1>
        <p className="text-white/60 text-sm mt-1">
          Xin chào <span className="text-white font-semibold">{ticket.guestName}</span>
        </p>
      </div>

      {/* Main card */}
      <div className="container mx-auto px-4 pb-10 max-w-lg -mt-2">
        <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
          {/* Status badge */}
          <div className={`px-6 py-3 text-center text-sm font-semibold ${
            isPending
              ? 'bg-amber-50 text-amber-700 border-b border-amber-100'
              : isConfirmed
              ? 'bg-green-50 text-green-700 border-b border-green-100'
              : 'bg-red-50 text-red-700 border-b border-red-100'
          }`}>
            {isPending && (
              <span className="flex items-center justify-center gap-2">
                <Timer className="h-4 w-4" />
                ⏳ Chờ thanh toán
              </span>
            )}
            {isConfirmed && (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                ✅ Đã thanh toán
              </span>
            )}
            {isExpired && (
              <span className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                ❌ Vé đã hết hạn / bị hủy
              </span>
            )}
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              {origin}
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              {destination}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Ticket ID */}
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Mã vé</span>
              <p className="text-3xl font-extrabold text-[#1a3a8f] mt-1">#{ticket.id}</p>
            </div>

            {/* Trip details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-500">📅 Ngày đi</span>
                <p className="font-semibold text-sm mt-1">{ticket.trip?.departureDate}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-500">🕐 Giờ khởi hành</span>
                <p className="font-semibold text-sm mt-1">{ticket.trip?.schedule?.departureTime}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-500">💺 Số chỗ</span>
                <p className="font-semibold text-sm mt-1">{ticket.seatCount} chỗ</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-500">🚌 Xe</span>
                <p className="font-semibold text-sm mt-1">{ticket.trip?.bus?.busType}</p>
              </div>
            </div>

            {/* Pickup / Dropoff */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500">Điểm đón</span>
                  <p className="text-sm font-medium">{ticket.pickUpLocation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500">Điểm trả</span>
                  <p className="text-sm font-medium">{ticket.dropOffLocation}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total price */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 text-center">
              <span className="text-xs text-blue-600 font-semibold uppercase tracking-widest">Tổng tiền</span>
              <p className="text-3xl font-extrabold text-[#1a3a8f] mt-2">
                {formatPrice(Number(ticket.totalPrice))}
              </p>
            </div>

            {/* Payment button */}
            {isPending && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30 cursor-pointer"
                >
                  <CreditCard className="h-5 w-5" />
                  {paying ? 'Đang chuyển đến PayOS...' : 'Thanh toán ngay'}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Vui lòng thanh toán sớm. Vé sẽ tự động bị hủy nếu không thanh toán trong thời gian quy định.
                </p>
              </div>
            )}

            {isConfirmed && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">Vé đã được thanh toán thành công!</p>
                <p className="text-green-600 text-sm mt-1">
                  Vui lòng đến điểm đón trước 15 phút và mang theo mã vé <strong>#{ticket.id}</strong>.
                </p>
              </div>
            )}

            {isExpired && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-semibold">Vé đã hết hạn hoặc bị hủy</p>
                <p className="text-red-600 text-sm mt-1">
                  Vui lòng liên hệ nhân viên để đặt vé mới.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-xs">
            Cần hỗ trợ? Liên hệ hotline <strong className="text-gray-600">1900 0000</strong>
          </p>
          <p className="text-gray-300 text-[11px] mt-1">
            © 2026 VinaCoach. Hệ thống đặt vé xe khách.
          </p>
        </div>
      </div>
    </div>
  );
}
