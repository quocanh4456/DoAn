import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '@/services/trip.service';
import { ticketService } from '@/services/ticket.service';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bus, MapPin, Clock, Timer, CreditCard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip, Ticket } from '@/types';

export function BookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [pickUpLocation, setPickUpLocation] = useState('');
  const [dropOffLocation, setDropOffLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (tripId) {
      tripService.getOne(Number(tripId)).then(({ data }) => setTrip(data));
    }
  }, [tripId]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Hết thời gian giữ chỗ. Vé đã bị hủy.');
          setTicket(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price),
    [],
  );

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;
    setLoading(true);
    try {
      const { data } = await ticketService.create({
        tripId: trip.id,
        seatCount,
        pickUpLocation,
        dropOffLocation,
      });
      setTicket(data);
      setCountdown(data.expiresIn || 600);
      toast.success('Giữ chỗ thành công! Vui lòng thanh toán trong 10 phút.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đặt vé');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!ticket) return;
    setPaying(true);
    try {
      const { data } = await paymentService.createVnpayUrl(ticket.id);
      window.location.href = data.paymentUrl;
    } catch {
      toast.error('Không thể tạo liên kết thanh toán');
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!ticket) return;
    try {
      await ticketService.cancel(ticket.id);
      toast.info('Đã hủy vé');
      setTicket(null);
      setCountdown(0);
    } catch {
      toast.error('Không thể hủy vé');
    }
  };

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Bus className="h-8 w-8 text-primary/50" />
        </div>
        Đang tải thông tin chuyến...
      </div>
    );
  }

  const basePrice = Number(trip.schedule?.route?.basePrice || 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Đặt vé</h1>

      <Card className="mb-6 border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            {trip.schedule?.route?.origin}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            {trip.schedule?.route?.destination}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
              {trip.schedule?.departureTime} - {trip.departureDate}
            </span>
            <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
              <Bus className="h-4 w-4 text-orange-500" />
              {trip.bus?.busType} ({trip.bus?.totalSeats} chỗ)
            </span>
            <Badge className="bg-green-500 text-white">Còn {trip.availableSeats} chỗ</Badge>
          </div>
          <div className="mt-4 text-2xl font-bold text-primary">
            {formatPrice(basePrice)}<span className="text-sm font-normal text-muted-foreground">/vé</span>
          </div>
        </CardContent>
      </Card>

      {!ticket ? (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đặt vé</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seatCount">Số lượng vé</Label>
                <Input
                  id="seatCount"
                  type="number"
                  min={1}
                  max={trip.availableSeats}
                  value={seatCount}
                  onChange={(e) => setSeatCount(Number(e.target.value))}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickUp">
                  <MapPin className="h-3.5 w-3.5 inline mr-1 text-green-500" />
                  Địa điểm đón
                </Label>
                <Input
                  id="pickUp"
                  placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
                  value={pickUpLocation}
                  onChange={(e) => setPickUpLocation(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropOff">
                  <MapPin className="h-3.5 w-3.5 inline mr-1 text-red-500" />
                  Địa điểm trả
                </Label>
                <Input
                  id="dropOff"
                  placeholder="VD: 456 Trần Phú, TP. Đà Lạt"
                  value={dropOffLocation}
                  onChange={(e) => setDropOffLocation(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center bg-primary/5 rounded-xl p-4">
                <span className="font-medium">Tổng tiền:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(basePrice * seatCount)}
                </span>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Giữ chỗ & Thanh toán'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <span>Vé đã được giữ chỗ</span>
              <Badge
                variant="destructive"
                className="flex items-center gap-1 text-lg px-4 py-1.5 bg-red-500 text-white"
              >
                <Timer className="h-4 w-4" />
                {formatCountdown(countdown)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <span className="text-muted-foreground text-xs">Mã vé</span>
                <p className="font-bold text-lg text-primary">#{ticket.id}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <span className="text-muted-foreground text-xs">Số chỗ</span>
                <p className="font-bold text-lg">{ticket.seatCount}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <span className="text-muted-foreground text-xs">Đón tại</span>
                <p className="font-medium">{ticket.pickUpLocation}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <span className="text-muted-foreground text-xs">Trả tại</span>
                <p className="font-medium">{ticket.dropOffLocation}</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center bg-primary/5 rounded-xl p-4">
              <span className="font-medium">Tổng tiền:</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(Number(ticket.totalPrice))}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 h-11 text-base font-semibold bg-green-600 hover:bg-green-700"
                onClick={handlePayment}
                disabled={paying}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                {paying ? 'Đang chuyển...' : 'Thanh toán VNPay'}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="h-11">
                Hủy vé
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Vui lòng thanh toán trước khi hết thời gian giữ chỗ.
              Sau 10 phút, chỗ sẽ tự động được trả lại.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
