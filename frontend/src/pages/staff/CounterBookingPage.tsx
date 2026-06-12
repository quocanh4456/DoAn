import { useState, useEffect } from 'react';
import { tripService } from '@/services/trip.service';
import { ticketService } from '@/services/ticket.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, MapPin, Clock, Bus, ChevronDown, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip } from '@/types';

// ── Danh sách điểm đón/trả cố định theo từng thành phố ──────────────
const PICKUP_LOCATIONS: Record<string, string[]> = {
  'TP. Hồ Chí Minh': [
    'Bến xe Miền Đông (Đinh Tiên Hoàng, Q. Bình Thạnh)',
    'Bến xe Miền Tây (Kinh Dương Vương, Q. 6)',
    'Văn phòng Quận 1 (Phạm Ngũ Lão)',
    'Văn phòng Quận 7 (Nguyễn Thị Thập)',
    'Văn phòng Gò Vấp (Nguyễn Kiệm)',
    'Văn phòng Bình Dương (QL 13)',
  ],
  'Hà Nội': [
    'Bến xe Mỹ Đình (Phạm Hùng, Nam Từ Liêm)',
    'Bến xe Giáp Bát (Giải Phóng, Hoàng Mai)',
    'Bến xe Nước Ngầm (Ngọc Hồi, Hoàng Mai)',
    'Văn phòng Hoàn Kiếm (Đinh Lễ)',
    'Văn phòng Cầu Giấy (Trần Thái Tông)',
  ],
  'Đà Nẵng': [
    'Bến xe Đà Nẵng (Tôn Đức Thắng)',
    'Văn phòng Hải Châu (Điện Biên Phủ)',
    'Văn phòng Thanh Khê (Trần Cao Vân)',
  ],
};

const DROPOFF_LOCATIONS: Record<string, string[]> = {
  'Đà Lạt': [
    'Bến xe Đà Lạt (Nguyễn Thị Minh Khai)',
    'Trung tâm thành phố (Hòa Bình)',
    'Khu vực Hồ Xuân Hương',
    'Khu vực Thác Cam Ly',
  ],
  'Nha Trang': [
    'Bến xe Nha Trang (23 tháng 10)',
    'Trung tâm thành phố (Trần Phú)',
    'Khu vực Vinpearl (Vĩnh Phước)',
    'Khu vực Phạm Văn Đồng',
  ],
  'Vũng Tàu': [
    'Bến xe Vũng Tàu (Nguyễn Ngọc Nhựt)',
    'Trung tâm thành phố (Lê Lợi)',
    'Khu vực Bãi Trước (Thùy Vân)',
    'Khu vực Bãi Sau (Thùy Vân)',
  ],
  'Cần Thơ': [
    'Bến xe Cần Thơ (Nguyễn Trãi)',
    'Trung tâm thành phố (Hòa Bình)',
    'Khu vực Ninh Kiều',
    'Khu vực Cái Răng',
  ],
  'Phan Thiết': [
    'Bến xe Phan Thiết (Hùng Vương)',
    'Trung tâm thành phố (Trần Hưng Đạo)',
    'Khu vực Mũi Né',
  ],
  'Hải Phòng': [
    'Bến xe Hải Phòng (Lạch Tray)',
    'Trung tâm thành phố (Điện Biên Phủ)',
    'Khu vực Đồ Sơn',
  ],
  'Sapa': [
    'Bến xe Sapa (trung tâm thị trấn)',
    'Trung tâm Sapa (Fansipan Plaza)',
    'Khu vực Cầu Mây',
  ],
  'Huế': [
    'Bến xe Huế (An Hòa)',
    'Bến xe Phía Nam Huế (Nguyễn Hoàng)',
    'Trung tâm thành phố (Lê Lợi)',
    'Khu vực Đại Nội',
  ],
};

function getPickupOptions(origin: string): string[] {
  const key = Object.keys(PICKUP_LOCATIONS).find((k) =>
    origin?.includes(k) || k.includes(origin),
  );
  return key ? PICKUP_LOCATIONS[key] : [];
}

function getDropoffOptions(destination: string): string[] {
  const key = Object.keys(DROPOFF_LOCATIONS).find((k) =>
    destination?.includes(k) || k.includes(destination),
  );
  return key ? DROPOFF_LOCATIONS[key] : [];
}

function LocationSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  color,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  color: 'green' | 'red';
}) {
  const borderColor = color === 'green' ? '#22c55e' : '#ef4444';
  const bgColor = color === 'green' ? '#f0fdf4' : '#fef2f2';

  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        style={{
          appearance: 'none',
          width: '100%',
          height: '40px',
          padding: '0 40px 0 14px',
          borderRadius: '6px',
          border: `1px solid ${value ? borderColor : '#e2e8f0'}`,
          background: value ? bgColor : '#fff',
          fontSize: '14px',
          color: value ? '#1e293b' : '#94a3b8',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4"
        style={{ color: value ? borderColor : '#94a3b8' }}
      />
    </div>
  );
}

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

  // Reset dropdowns when trip changes
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
            <Input
              placeholder="Điểm đi"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="flex-1 min-w-[150px]"
            />
            <Input
              placeholder="Điểm đến"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex-1 min-w-[150px]"
            />
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
                    <Clock className="h-3 w-3" /> {trip.schedule?.departureTime}
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

                  {/* Guest info */}
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
                    {getPickupOptions(selectedTrip.schedule?.route?.origin || '').length > 0 ? (
                      <LocationSelect
                        id="pickUp"
                        value={pickUp}
                        onChange={setPickUp}
                        options={getPickupOptions(selectedTrip.schedule?.route?.origin || '')}
                        placeholder="-- Chọn điểm đón --"
                        color="green"
                      />
                    ) : (
                      <Input
                        value={pickUp}
                        onChange={(e) => setPickUp(e.target.value)}
                        placeholder="Nhập địa điểm đón..."
                        required
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dropOff">
                      <MapPin className="h-3.5 w-3.5 inline mr-1 text-red-500" />
                      Địa điểm trả <span className="text-xs text-muted-foreground font-normal">({selectedTrip.schedule?.route?.destination})</span>
                    </Label>
                    {getDropoffOptions(selectedTrip.schedule?.route?.destination || '').length > 0 ? (
                      <LocationSelect
                        id="dropOff"
                        value={dropOff}
                        onChange={setDropOff}
                        options={getDropoffOptions(selectedTrip.schedule?.route?.destination || '')}
                        placeholder="-- Chọn điểm trả --"
                        color="red"
                      />
                    ) : (
                      <Input
                        value={dropOff}
                        onChange={(e) => setDropOff(e.target.value)}
                        placeholder="Nhập địa điểm trả..."
                        required
                      />
                    )}
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
