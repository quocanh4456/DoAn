import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tripService } from '@/services/trip.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bus, Clock, MapPin, Users, ArrowRight, Navigation,
  CalendarDays, Search, ArrowLeftRight, ChevronDown,
  SlidersHorizontal, Star, Zap, AlertCircle, Mic, MicOff,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import type { Trip } from '@/types';
import { useVoiceSearch, type VoiceTarget } from '@/hooks/useVoiceSearch';

function getBusEmoji(busType: string): string {
  if (!busType) return '🚌';
  const t = busType.toLowerCase();
  if (t.includes('limousine')) return '🚐';
  if (t.includes('gi') && t.includes('ng') && t.includes('n')) return '🛌';
  if (t.includes('gh') && t.includes('ng')) return '💺';
  return '🚌';
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'seats'>('time');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const doSearch = async (o?: string, d?: string, dt?: string) => {
    const searchOrigin = o ?? origin;
    const searchDest = d ?? destination;
    const searchDate = dt ?? date;
    setLoading(true);
    try {
      const { data } = await tripService.search(searchOrigin, searchDest, searchDate);
      setTrips(data);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Lỗi khi tìm chuyến xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const o = searchParams.get('origin') || '';
    const d = searchParams.get('destination') || '';
    const dt = searchParams.get('date') || '';
    setOrigin(o);
    setDestination(d);
    setDate(dt);
    if (o || d || dt) {
      doSearch(o, d, dt);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleVoiceResult = useCallback((text: string, target: VoiceTarget) => {
    if (target === 'origin') setOrigin(text);
    else if (target === 'destination') setDestination(text);
  }, []);

  const { isListening, activeTarget, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: handleVoiceResult,
    onError: (msg) => toast.error(msg),
  });

  const handleMicClick = (target: VoiceTarget) => {
    if (isListening && activeTarget === target) {
      stopListening();
    } else {
      startListening(target);
      toast.info(
        target === 'origin' ? '🎤 Đang nghe... Nói tên điểm đi' : '🎤 Đang nghe... Nói tên điểm đến',
        { duration: 3000 },
      );
    }
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

  const sortedTrips = [...trips].sort((a, b) => {
    if (sortBy === 'price') return (a.schedule?.route?.basePrice || 0) - (b.schedule?.route?.basePrice || 0);
    if (sortBy === 'seats') return (b.availableSeats || 0) - (a.availableSeats || 0);
    return (a.schedule?.departureTime || '').localeCompare(b.schedule?.departureTime || '');
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#0a2463] to-[#1a3a8f] py-5 shadow-xl">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-white/70 mb-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  Điểm đi
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
                  <Input
                    placeholder="VD: TP. Hồ Chí Minh"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="bg-white/95 border-0 h-11 pl-9 pr-10 text-sm focus-visible:ring-orange-400"
                  />
                  {isSupported && (
                    <button
                      type="button"
                      onClick={() => handleMicClick('origin')}
                      title={isListening && activeTarget === 'origin' ? 'Dừng ghi âm' : 'Tìm kiếm bằng giọng nói (điểm đi)'}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                        isListening && activeTarget === 'origin'
                          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                          : 'text-gray-500 hover:text-[#1a3a8f] hover:bg-white/80'
                      }`}
                    >
                      {isListening && activeTarget === 'origin' ? (
                        <MicOff className="h-3.5 w-3.5" />
                      ) : (
                        <Mic className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSwap}
                className="hidden md:flex items-center justify-center w-10 h-10 mb-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all flex-shrink-0"
                title="Đổi chiều"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>

              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-white/70 mb-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  Điểm đến
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                  <Input
                    placeholder="VD: Đà Lạt"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-white/95 border-0 h-11 pl-9 pr-10 text-sm focus-visible:ring-orange-400"
                  />
                  {isSupported && (
                    <button
                      type="button"
                      onClick={() => handleMicClick('destination')}
                      title={isListening && activeTarget === 'destination' ? 'Dừng ghi âm' : 'Tìm kiếm bằng giọng nói (điểm đến)'}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                        isListening && activeTarget === 'destination'
                          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                          : 'text-gray-500 hover:text-red-500 hover:bg-white/80'
                      }`}
                    >
                      {isListening && activeTarget === 'destination' ? (
                        <MicOff className="h-3.5 w-3.5" />
                      ) : (
                        <Mic className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-white/70 mb-1.5 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Ngày đi
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white/95 border-0 h-11 text-sm focus-visible:ring-orange-400"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-400 text-white h-11 px-7 font-bold shrink-0 w-full md:w-auto rounded-xl shadow-lg shadow-orange-500/30"
              >
                <Search className="h-4 w-4 mr-1.5" />
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          <div className="lg:w-64 shrink-0">
            <button
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 mb-3 shadow-sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Bộ lọc</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#1a3a8f]" />
                    Bộ lọc
                  </h3>

                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sắp xếp theo</p>
                    <div className="space-y-2">
                      {[
                        { key: 'time', label: 'Giờ khởi hành', icon: Clock },
                        { key: 'price', label: 'Giá thấp nhất', icon: Zap },
                        { key: 'seats', label: 'Nhiều chỗ trống', icon: Users },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setSortBy(key as typeof sortBy)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            sortBy === key
                              ? 'bg-[#1a3a8f] text-white font-medium shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {trips.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tổng quan</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Số chuyến:</span>
                          <span className="font-bold text-[#1a3a8f]">{trips.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giá từ:</span>
                          <span className="font-bold text-orange-500">
                            {formatPrice(Math.min(...trips.map(t => t.schedule?.route?.basePrice || 999999999)))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {trips.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 text-sm">
                  Tìm thấy <span className="font-bold text-[#1a3a8f] text-base">{trips.length}</span> chuyến xe
                  {origin && destination && (
                    <span className="text-gray-400"> · {origin} → {destination}</span>
                  )}
                </p>
                {date && (
                  <Badge variant="outline" className="border-[#1a3a8f]/30 text-[#1a3a8f] text-xs">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {date}
                  </Badge>
                )}
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-gray-100" />
                ))}
              </div>
            )}

            {trips.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full bg-[#1a3a8f]/10 flex items-center justify-center mx-auto mb-5">
                  <Bus className="h-12 w-12 text-[#1a3a8f]/30" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                  {origin || destination ? 'Không tìm thấy chuyến xe' : 'Bắt đầu tìm kiếm'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {origin || destination
                    ? 'Thử thay đổi điểm đi, điểm đến hoặc ngày đi khác'
                    : 'Nhập điểm đi và điểm đến để xem các chuyến xe'}
                </p>
                {(origin || destination) && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-orange-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Thử tìm kiếm không dấu hoặc kiểm tra lại thông tin
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {sortedTrips.map((trip) => {
                const price = trip.schedule?.route?.basePrice || 0;
                const busType = trip.bus?.busType || 'Xe khách';
                const emoji = getBusEmoji(busType);
                const available = trip.availableSeats > 0;

                return (
                  <div
                    key={trip.id}
                    className={`bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-[#1a3a8f]/20 transition-all duration-300 overflow-hidden group ${!available ? 'opacity-60' : ''}`}
                  >
                    <div className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-4 bg-gradient-to-b from-[#1a3a8f] to-[#1e50b8] hidden md:block rounded-l-lg" />

                        <div className="flex-1 p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{emoji}</span>
                                <div>
                                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                                    <span>{trip.schedule?.route?.origin}</span>
                                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                                    <span>{trip.schedule?.route?.destination}</span>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">{busType}</div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium">
                                  <Clock className="h-3.5 w-3.5" />
                                  Khởi hành {trip.schedule?.departureTime}
                                </span>
                                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {trip.departureDate}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                                  trip.availableSeats > 5
                                    ? 'bg-green-50 text-green-700'
                                    : trip.availableSeats > 0
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'bg-red-50 text-red-600'
                                }`}>
                                  <Users className="h-3.5 w-3.5" />
                                  {trip.availableSeats > 0 ? `Còn ${trip.availableSeats} chỗ` : 'Hết chỗ'}
                                </span>
                                {trip.availableSeats > 0 && trip.availableSeats <= 5 && (
                                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs px-2.5 py-1.5 rounded-full font-semibold animate-pulse">
                                    🔥 Sắp hết
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:min-w-[140px]">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-orange-500">
                                  {formatPrice(price)}
                                </div>
                                <div className="text-xs text-gray-400">/người</div>
                                <div className="flex items-center gap-0.5 justify-end mt-1">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleBook(trip.id)}
                                disabled={!available}
                                className={`px-6 py-2 font-bold rounded-xl text-sm transition-all ${
                                  available
                                    ? 'bg-[#1a3a8f] hover:bg-orange-500 text-white shadow-md hover:shadow-orange-500/30 cursor-pointer'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {available ? 'Đặt vé' : 'Hết chỗ'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
