import { useState } from 'react';
import { tripService } from '@/services/trip.service';
import { ticketService } from '@/services/ticket.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, MapPin, Clock, Bus } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip } from '@/types';

export function CounterBookingPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [pickUp, setPickUp] = useState('');
  const [dropOff, setDropOff] = useState('');
  const [loading, setLoading] = useState(false);

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
      });
      toast.success('Đặt vé thành công!');
      setSelectedTrip(null);
      setSeatCount(1);
      setPickUp('');
      setDropOff('');
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
      <h1 className="text-2xl font-bold mb-6">Đặt vé tại quầy</h1>

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
                  <div className="space-y-2">
                    <Label>Địa điểm đón</Label>
                    <Input
                      value={pickUp}
                      onChange={(e) => setPickUp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Địa điểm trả</Label>
                    <Input
                      value={dropOff}
                      onChange={(e) => setDropOff(e.target.value)}
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
