import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tripService } from '@/services/trip.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Clock, MapPin, Users, ArrowRight, Navigation, CalendarDays, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import type { Trip } from '@/types';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    setLoading(true);
    try {
      const { data } = await tripService.search(origin, destination, date);
      setTrips(data);
    } catch {
      toast.error('Lỗi khi tìm chuyến xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (origin || destination || date) {
      doSearch();
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const handleBook = (tripId: number) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt vé');
      navigate('/login');
      return;
    }
    navigate(`/customer/booking/${tripId}`);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div>
      {/* Search Header */}
      <div className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-white/80 mb-1.5 block">
                <MapPin className="h-3.5 w-3.5 inline mr-1" />
                Điểm đi
              </label>
              <Input
                placeholder="VD: TP. Hồ Chí Minh"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-white/95 border-0 h-11"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-white/80 mb-1.5 block">
                <Navigation className="h-3.5 w-3.5 inline mr-1" />
                Điểm đến
              </label>
              <Input
                placeholder="VD: Đà Lạt"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-white/95 border-0 h-11"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-white/80 mb-1.5 block">
                <CalendarDays className="h-3.5 w-3.5 inline mr-1" />
                Ngày đi
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/95 border-0 h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 font-semibold shrink-0 w-full md:w-auto"
            >
              <Search className="h-4 w-4 mr-1.5" />
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6">
        {trips.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Tìm thấy <span className="font-semibold text-foreground">{trips.length}</span> chuyến xe
          </p>
        )}

        {trips.length === 0 && !loading && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bus className="h-10 w-10 text-primary/40" />
            </div>
            <p className="text-lg font-medium mb-1">Tìm chuyến xe phù hợp</p>
            <p className="text-sm">Nhập thông tin điểm đi, điểm đến để bắt đầu</p>
          </div>
        )}

        <div className="space-y-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg hover:border-primary/20 transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span>{trip.schedule?.route?.origin}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>{trip.schedule?.route?.destination}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {trip.schedule?.departureTime} - {trip.departureDate}
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                        <Bus className="h-3.5 w-3.5 text-orange-500" />
                        {trip.bus?.busType}
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                        <Users className="h-3.5 w-3.5 text-green-500" />
                        Còn {trip.availableSeats} chỗ
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {formatPrice(trip.schedule?.route?.basePrice || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">/vé</div>
                    </div>
                    <Badge
                      variant={trip.availableSeats > 0 ? 'default' : 'secondary'}
                      className={trip.availableSeats > 0 ? 'bg-green-500 text-white' : ''}
                    >
                      {trip.availableSeats > 0 ? 'Còn chỗ' : 'Hết chỗ'}
                    </Badge>
                    <Button
                      onClick={() => handleBook(trip.id)}
                      disabled={trip.availableSeats <= 0}
                      className="px-6"
                    >
                      Đặt vé
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
