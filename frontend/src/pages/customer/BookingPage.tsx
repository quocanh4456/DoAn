import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '@/services/trip.service';
import type { DynamicPrice } from '@/services/trip.service';
import { ticketService } from '@/services/ticket.service';
import { paymentService } from '@/services/payment.service';
import { promotionService } from '@/services/promotion.service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bus, MapPin, Clock, Timer, CreditCard, ArrowRight, ChevronDown, Zap, TrendingUp, Info, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip, Ticket } from '@/types';
import { Input } from '@/components/ui/input';



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

  const [promoCode, setPromoCode] = useState('');
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [promoLabel, setPromoLabel] = useState('');
  const [promoApplied, setPromoApplied] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const basePriceToValidate = dynamicPrice ? dynamicPrice.finalPrice : Number(trip?.schedule?.route?.basePrice || 0);
      const totalAmount = basePriceToValidate * seatCount;
      const { data } = await promotionService.validate(code, totalAmount);
      
      setPromoDiscountAmount(data.discountAmount);
      setPromoDiscountPercent(data.discountPercent);
      setPromoLabel(data.description);
      setPromoApplied(data.code);
      toast.success(`Áp dụng mã "${data.code}" thành công!`);
    } catch (err: any) {
      setPromoDiscountAmount(0);
      setPromoDiscountPercent(0);
      setPromoApplied('');
      setPromoLabel('');
      setPromoError(err.response?.data?.message || 'Mã khuyến mãi không hợp lệ.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoDiscountAmount(0);
    setPromoDiscountPercent(0);
    setPromoLabel('');
    setPromoApplied('');
    setPromoError('');
  };

  const [dynamicPrice, setDynamicPrice] = useState<DynamicPrice | null>(null);

  useEffect(() => {
    if (tripId) {
      tripService.getOne(Number(tripId)).then(({ data }) => setTrip(data));
      tripService.getDynamicPrice(Number(tripId))
        .then(({ data }) => setDynamicPrice(data))
        .catch(() => {});
    }
  }, [tripId]);

  useEffect(() => {
    setPickUpLocation('');
    setDropOffLocation('');
  }, [trip?.id]);

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
    if (!pickUpLocation) { toast.error('Vui lòng chọn điểm đón'); return; }
    if (!dropOffLocation) { toast.error('Vui lòng chọn điểm trả'); return; }
    setLoading(true);
    try {
      const { data } = await ticketService.create({
        tripId: trip.id,
        seatCount,
        pickUpLocation,
        dropOffLocation,
        promoCode: promoApplied || undefined,
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
      const { data } = await paymentService.createPayOSUrl(ticket.id);
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

  const origin = trip.schedule?.route?.origin ?? '';
  const destination = trip.schedule?.route?.destination ?? '';
  const basePrice = dynamicPrice ? dynamicPrice.finalPrice : Number(trip.schedule?.route?.basePrice || 0);
  const hasAIPrice = dynamicPrice && dynamicPrice.totalMultiplier > 1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Đặt vé</h1>

      <Card className="mb-6 border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            {origin}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            {destination}
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
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(basePrice)}<span className="text-sm font-normal text-muted-foreground">/vé</span>
              </div>
              {hasAIPrice && dynamicPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(dynamicPrice.basePrice)}
                </span>
              )}
              {hasAIPrice && (
                <Badge className="bg-orange-500 text-white text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Giá động ×{dynamicPrice?.totalMultiplier}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {dynamicPrice && (
        <Card className={`mb-6 ${
          hasAIPrice
            ? 'border-orange-200 bg-orange-50/50'
            : 'border-green-200 bg-green-50/50'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${hasAIPrice ? 'text-orange-500' : 'text-green-600'}`} />
              <span className={hasAIPrice ? 'text-orange-700' : 'text-green-700'}>
                {hasAIPrice ? '⚡ Giá vé đang được điều chỉnh tự động (Dynamic Pricing)' : '✅ Giá vé thường — Không áp dụng điều chỉnh'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">Giá cơ bản</span>
                <span className="font-medium">{formatPrice(dynamicPrice.basePrice)}</span>
              </div>

              {dynamicPrice.factors.filter((f) => f.active).map((factor) => (
                <div key={factor.label} className="flex items-center justify-between text-sm py-1 border-t border-orange-100">
                  <span className="flex items-center gap-1.5">
                    <span className="text-orange-500">↑</span>
                    <span className="text-orange-700 font-medium">{factor.label}</span>
                  </span>
                  <span className="text-orange-600 font-semibold">×{factor.multiplier.toFixed(2)}</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                <span className="font-semibold text-sm">Giá sau điều chỉnh</span>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${
                    hasAIPrice ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {formatPrice(dynamicPrice.finalPrice)}
                  </span>
                  {hasAIPrice && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                      ×{dynamicPrice.totalMultiplier} tổng
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {hasAIPrice && (
              <p className="text-xs text-orange-500/80 flex items-center gap-1 mt-3">
                <Info className="h-3 w-3" />
                Giá được điều chỉnh tự động dựa trên nhu cầu thị trường. Tối đa ×1.5 giá gốc.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!ticket ? (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đặt vé</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBooking} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="seatCount">Số lượng vé</Label>
                <input
                  id="seatCount"
                  type="number"
                  min={1}
                  max={trip.availableSeats}
                  value={seatCount}
                  onChange={(e) => setSeatCount(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickUp">
                  <MapPin className="h-3.5 w-3.5 inline mr-1 text-green-500" />
                  Điểm đón <span className="text-xs text-muted-foreground font-normal">({origin})</span>
                </Label>
                <Input
                  id="pickUp"
                  value={pickUpLocation}
                  onChange={(e) => setPickUpLocation(e.target.value)}
                  placeholder={`Nhập địa chỉ đón tại ${origin}...`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropOff">
                  <MapPin className="h-3.5 w-3.5 inline mr-1 text-red-500" />
                  Điểm trả <span className="text-xs text-muted-foreground font-normal">({destination})</span>
                </Label>
                <Input
                  id="dropOff"
                  value={dropOffLocation}
                  onChange={(e) => setDropOffLocation(e.target.value)}
                  placeholder={`Nhập địa chỉ trả tại ${destination}...`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoCode">
                  <Tag className="h-3.5 w-3.5 inline mr-1 text-orange-500" />
                  Mã khuyến mãi <span className="text-xs text-muted-foreground font-normal">(không bắt buộc)</span>
                </Label>
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div>
                      <span className="text-sm font-semibold text-green-700">{promoApplied}</span>
                      <span className="text-xs text-green-600 ml-2">— {promoLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-green-600 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="promoCode"
                      placeholder="Nhập mã khuyến mãi"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                      className="flex-1 h-11 font-mono tracking-wider uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || isApplyingPromo}
                      className="h-11 px-5 shrink-0"
                    >
                      {isApplyingPromo ? 'Đang ktra...' : 'Áp dụng'}
                    </Button>
                  </div>
                )}
                {promoError && (
                  <p className="text-xs text-red-500 ml-1">{promoError}</p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center bg-primary/5 rounded-xl p-4">
                <span className="font-medium">Tổng tiền:</span>
                <div className="text-right">
                  {promoDiscountAmount > 0 && (
                    <div className="text-sm text-muted-foreground line-through">
                      {formatPrice(basePrice * seatCount)}
                    </div>
                  )}
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice((basePrice * seatCount) - promoDiscountAmount)}
                  </span>
                  {promoDiscountPercent > 0 && (
                    <span className="ml-2 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">
                      -{promoDiscountPercent}%
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading || !pickUpLocation || !dropOffLocation}
              >
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
              <div className="bg-muted rounded-lg p-3 col-span-2 sm:col-span-1">
                <span className="text-muted-foreground text-xs">Đón tại</span>
                <p className="font-medium text-sm leading-snug">{ticket.pickUpLocation}</p>
              </div>
              <div className="bg-muted rounded-lg p-3 col-span-2 sm:col-span-1">
                <span className="text-muted-foreground text-xs">Trả tại</span>
                <p className="font-medium text-sm leading-snug">{ticket.dropOffLocation}</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center bg-primary/5 rounded-xl p-4">
              <span className="font-medium">Tổng tiền:</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(Number(ticket.totalPrice))}
              </span>
            </div>

            <div className="flex gap-3 relative z-10">
              <button
                type="button"
                className="flex-1 h-11 text-base font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer relative z-20"
                onClick={handlePayment}
                disabled={paying}
              >
                <CreditCard className="h-4 w-4" />
                {paying ? 'Đang chuyển...' : 'Thanh toán PayOS'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="h-11 px-4 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer relative z-20"
              >
                Hủy vé
              </button>
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
