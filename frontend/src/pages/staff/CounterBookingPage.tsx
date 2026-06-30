import { useState, useEffect } from 'react';
import { tripService } from '@/services/trip.service';
import { ticketService } from '@/services/ticket.service';
import { routeService } from '@/services/route.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, MapPin, Clock, Bus, ChevronDown, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip } from '@/types';
import dayjs from 'dayjs';




export function CounterBookingPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [pickUp, setPickUp] = useState('');
  const [dropOff, setDropOff] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<{ origin: string; destination: string }[]>([]);

  useEffect(() => {
    routeService.getAll().then((res) => {
      setRoutes(res.data);
    });
  }, []);

  const uniqueOrigins = Array.from(new Set(routes.map(r => r.origin)));
  const uniqueDestinations = Array.from(new Set(routes.map(r => r.destination)));

  useEffect(() => {
    setPickUp('');
    setDropOff('');
  }, [selectedTrip?.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await tripService.search(origin, destination, date);
      setTrips(data);
    } catch {
      toast.error('Lỗi khi tìm chuyến');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setLoading(true);
    try {
      await ticketService.create({
        tripId: selectedTrip.id,
        seatCount,
        pickUpLocation: pickUp,
        dropOffLocation: dropOff,
        guestName: guestName || undefined,
        guestPhone: guestPhone || undefined,
        guestEmail: guestEmail || undefined,
      });
      if (guestEmail) {
        toast.success(`Đặt vé thành công! Email thanh toán đã gửi đến ${guestEmail}`);
      } else {
        toast.success('Đặt vé thành công!');
      }
      setSelectedTrip(null);
      setSeatCount(1);
      setPickUp('');
      setDropOff('');
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đặt vé');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Đặt vé online</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[150px]">
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
              >
                <option value="">-- Chọn điểm đi --</option>
                {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
              >
                <option value="">-- Chọn điểm đến --</option>
                {uniqueDestinations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 min-w-[150px]"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Tìm
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Kết quả tìm kiếm</h2>
          {trips.length === 0 && (
            <p className="text-muted-foreground text-sm">Chưa có kết quả</p>
          )}
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className={`cursor-pointer transition ${
                selectedTrip?.id === trip.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTrip(trip)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {trip.schedule?.route?.origin} → {trip.schedule?.route?.destination}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {trip.schedule?.departureTime} - {dayjs(trip.departureDate).format('DD/MM/YYYY')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="h-3 w-3" /> {trip.bus?.busType}
                  </span>
                  <Badge variant="outline">Còn {trip.availableSeats} chỗ</Badge>
                </div>
                <div className="font-bold text-primary mt-1">
                  {formatPrice(trip.schedule?.route?.basePrice || 0)}/vé
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          {selectedTrip ? (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đặt vé</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBook} className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Chuyến: {selectedTrip.schedule?.route?.origin} →{' '}
                    {selectedTrip.schedule?.route?.destination} |{' '}
                    {selectedTrip.schedule?.departureTime} - {selectedTrip.departureDate}
                  </div>
                  <div className="space-y-2">
                    <Label>Số vé</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedTrip.availableSeats}
                      value={seatCount}
                      onChange={(e) => setSeatCount(Number(e.target.value))}
                    />
                  </div>

                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', marginBottom: '4px' }}>
                    <div className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      THÔNG TIN KHÁCH HÀNG
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="guestName">
                          <User className="h-3.5 w-3.5 inline mr-1 text-blue-500" />
                          Tên khách hàng
                        </Label>
                        <Input
                          id="guestName"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="VD: Nguyễn Văn A"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="guestPhone">
                          <Phone className="h-3.5 w-3.5 inline mr-1 text-blue-500" />
                          SĐT khách
                        </Label>
                        <Input
                          id="guestPhone"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="VD: 0987654321"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="guestEmail">
                          <Mail className="h-3.5 w-3.5 inline mr-1 text-blue-500" />
                          Email khách <span className="text-xs text-muted-foreground font-normal">(gửi link thanh toán)</span>
                        </Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="VD: khach@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickUp">
                      <MapPin className="h-3.5 w-3.5 inline mr-1 text-green-500" />
                      Địa điểm đón <span className="text-xs text-muted-foreground font-normal">({selectedTrip.schedule?.route?.origin})</span>
                    </Label>
                    <Input
                      id="pickUp"
                      value={pickUp}
                      onChange={(e) => setPickUp(e.target.value)}
                      placeholder={`Nhập địa chỉ đón tại ${selectedTrip.schedule?.route?.origin}...`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dropOff">
                      <MapPin className="h-3.5 w-3.5 inline mr-1 text-red-500" />
                      Địa điểm trả <span className="text-xs text-muted-foreground font-normal">({selectedTrip.schedule?.route?.destination})</span>
                    </Label>
                    <Input
                      id="dropOff"
                      value={dropOff}
                      onChange={(e) => setDropOff(e.target.value)}
                      placeholder={`Nhập địa chỉ trả tại ${selectedTrip.schedule?.route?.destination}...`}
                      required
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Tổng:</span>
                    <span className="text-primary">
                      {formatPrice(
                        (selectedTrip.schedule?.route?.basePrice || 0) * seatCount,
                      )}
                    </span>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đặt vé'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Chọn một chuyến bên trái để đặt vé
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
