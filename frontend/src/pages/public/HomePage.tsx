import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Bus,
  MapPin,
  Shield,
  Clock,
  CreditCard,
  Headphones,
  CheckCircle,
  ArrowRight,
  ArrowLeftRight,
  CalendarDays,
  Navigation,
  Star,
  TrendingUp,
  Users,
  Zap,
  Tag,
  CalendarClock,
  Info,
  Mic,
  MicOff,
} from 'lucide-react';
import { useVoiceSearch, type VoiceTarget } from '@/hooks/useVoiceSearch';
import { toast } from 'sonner';

const popularRoutes = [
  { from: 'TP. Hồ Chí Minh', to: 'Đà Lạt', price: '250.000đ', time: '~7 tiếng', emoji: '🏔️', trips: 24 },
  { from: 'TP. Hồ Chí Minh', to: 'Nha Trang', price: '300.000đ', time: '~9 tiếng', emoji: '🏖️', trips: 18 },
  { from: 'TP. Hồ Chí Minh', to: 'Vũng Tàu', price: '150.000đ', time: '~2.5 tiếng', emoji: '⛱️', trips: 32 },
  { from: 'TP. Hồ Chí Minh', to: 'Cần Thơ', price: '180.000đ', time: '~3.5 tiếng', emoji: '🌾', trips: 20 },
  { from: 'Hà Nội', to: 'Sapa', price: '350.000đ', time: '~6 tiếng', emoji: '🌿', trips: 15 },
  { from: 'Đà Nẵng', to: 'Huế', price: '100.000đ', time: '~2.5 tiếng', emoji: '🏛️', trips: 28 },
];

const highlights = [
  { icon: CheckCircle, label: 'Chắc chắn có chỗ', desc: 'Hoàn 150% nếu không có xe', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Headphones, label: 'Hỗ trợ 24/7', desc: 'Luôn sẵn sàng hỗ trợ bạn', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: CreditCard, label: 'Giá tốt nhất', desc: 'Nhiều ưu đãi & khuyến mãi', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Shield, label: 'Thanh toán an toàn', desc: 'Mã hóa dữ liệu tuyệt đối', color: 'text-purple-500', bg: 'bg-purple-50' },
];

const stats = [
  { value: '500K+', label: 'Khách hàng tin dùng', icon: Users },
  { value: '50+', label: 'Tuyến đường toàn quốc', icon: Navigation },
  { value: '99%', label: 'Khách hàng hài lòng', icon: Star },
  { value: '24/7', label: 'Hỗ trợ khách hàng', icon: Headphones },
];

const promoItems = [
  {
    label: 'Giảm 20% chuyến đầu tiên',
    desc: 'Áp dụng cho khách hàng mới đăng ký tài khoản. Không giới hạn tuyến đường.',
    tag: 'Ưu đãi',
    tagColor: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-50',
    code: 'NEWUSER20',
    expiry: '31/07/2026',
    terms: [
      'Áp dụng cho khách hàng đăng ký tài khoản mới lần đầu.',
      'Giảm tối đa 100.000đ trên mỗi vé.',
      'Không áp dụng cùng các chương trình khuyến mãi khác.',
      'Mỗi tài khoản chỉ được sử dụng 1 lần.',
    ],
  },
  {
    label: 'Combo 2 vé tiết kiệm',
    desc: 'Đặt 2 vé cùng chuyến chỉ tính tiền 1.8 vé. Đi cùng bạn bè thêm vui.',
    tag: 'Mới',
    tagColor: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    code: 'COMBO2VE',
    expiry: '30/06/2026',
    terms: [
      'Đặt 2 vé cùng chuyến, cùng lúc để được áp dụng.',
      'Tương đương giảm 10% trên tổng giá 2 vé.',
      'Áp dụng tất cả tuyến đường.',
      'Có thể kết hợp với ưu đãi thành viên.',
    ],
  },
  {
    label: 'Thứ 3 giảm 15%',
    desc: 'Mỗi thứ Ba hàng tuần, giảm 15% tất cả các tuyến. Đặt sớm hưởng giá tốt.',
    tag: 'Hàng tuần',
    tagColor: 'bg-green-100 text-green-700',
    border: 'border-green-200',
    accent: 'text-green-600',
    accentBg: 'bg-green-50',
    code: 'THU3VUI',
    expiry: 'Không giới hạn',
    terms: [
      'Chỉ áp dụng cho các chuyến khởi hành vào thứ Ba.',
      'Đặt vé trước ít nhất 1 ngày để được áp dụng.',
      'Giảm tối đa 80.000đ trên mỗi vé.',
      'Không giới hạn số lần sử dụng.',
    ],
  },
];


export function HomePage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [selectedPromo, setSelectedPromo] = useState<typeof promoItems[number] | null>(null);
  const [returnDate, setReturnDate] = useState('');
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const navigate = useNavigate();

  const handleVoiceResult = useCallback((text: string, target: VoiceTarget) => {
    if (target === 'origin') setOrigin(text);
    else if (target === 'destination') setDestination(text);
  }, []);

  const { isListening, activeTarget, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: handleVoiceResult,
    onError: (msg) => toast.error(msg),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    if (date) params.set('date', date);
    if (tripType === 'round-trip') {
      params.set('type', 'round-trip');
      if (returnDate) params.set('returnDate', returnDate);
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleRouteClick = (from: string, to: string) => {
    const params = new URLSearchParams();
    params.set('origin', from);
    params.set('destination', to);
    navigate(`/search?${params.toString()}`);
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

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

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative pt-10 pb-20 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.png" alt="Hero Background" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2463]/90 via-[#1a3a8f]/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-5">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              Đặt vé nhanh — Nhận vé ngay — Lên xe thôi!
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Đặt vé xe khách
              <span className="text-orange-400 block">trực tuyến dễ dàng</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Hơn <strong className="text-white">500.000 khách hàng</strong> tin dùng. Đón &amp; trả tận nhà, an toàn, minh bạch.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto">
            {/* Trip type tabs */}
            <div className="flex gap-1 mb-0 bg-white/10 backdrop-blur-sm w-fit rounded-t-2xl px-2 pt-2">
              {(['one-way', 'round-trip'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTripType(type)}
                  className={`px-5 py-2 text-sm font-medium rounded-t-xl transition-all ${
                    tripType === type
                      ? 'bg-white text-[#1a3a8f] shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {type === 'one-way' ? '🚌 Một chiều' : '🔄 Khứ hồi'}
                </button>
              ))}
            </div>

            <Card className="shadow-2xl border-0 rounded-tl-none rounded-2xl rounded-tr-2xl overflow-visible">
              <CardContent className="p-5 md:p-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-end">
                  {/* Origin */}
                  <div className="flex-1 w-full text-left">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      Điểm đi
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      <Input
                        placeholder="VD: TP. Hồ Chí Minh"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="h-12 pl-9 pr-10 border-gray-200 focus:border-[#1a3a8f] text-sm"
                      />
                      {isSupported && (
                        <button
                          type="button"
                          onClick={() => handleMicClick('origin')}
                          title={isListening && activeTarget === 'origin' ? 'Dừng ghi âm' : 'Tìm kiếm bằng giọng nói (điểm đi)'}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                            isListening && activeTarget === 'origin'
                              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                              : 'text-gray-400 hover:text-[#1a3a8f] hover:bg-[#1a3a8f]/10'
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

                  {/* Swap button */}
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="hidden md:flex items-center justify-center w-10 h-10 mb-1 rounded-full border-2 border-gray-200 bg-white hover:border-[#1a3a8f] hover:bg-[#1a3a8f] hover:text-white text-gray-400 transition-all flex-shrink-0 shadow-sm"
                    title="Đổi chiều"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>

                  {/* Destination */}
                  <div className="flex-1 w-full text-left">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Điểm đến
                    </label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      <Input
                        placeholder="VD: Đà Lạt"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="h-12 pl-9 pr-10 border-gray-200 focus:border-[#1a3a8f] text-sm"
                      />
                      {isSupported && (
                        <button
                          type="button"
                          onClick={() => handleMicClick('destination')}
                          title={isListening && activeTarget === 'destination' ? 'Dừng ghi âm' : 'Tìm kiếm bằng giọng nói (điểm đến)'}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                            isListening && activeTarget === 'destination'
                              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
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

                  {/* Date */}
                  <div className="flex-1 w-full text-left">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-blue-500" />
                      Ngày đi
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-12 border-gray-200 focus:border-[#1a3a8f] text-sm"
                    />
                  </div>

                  {/* Return date — only for round-trip */}
                  {tripType === 'round-trip' && (
                    <div className="flex-1 w-full text-left">
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-purple-500" />
                        Ngày về
                      </label>
                      <Input
                        type="date"
                        value={returnDate}
                        min={date || undefined}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="h-12 border-gray-200 focus:border-purple-500 text-sm"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-12 px-8 text-base font-bold shrink-0 w-full md:w-auto bg-orange-500 hover:bg-orange-400 text-white rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50"
                  >
                    Tìm chuyến
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Trust Badges ────────────────────────────────── */}
      <section className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {highlights.map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-4 px-5">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800 leading-tight">{item.label}</div>
                  <div className="text-xs text-gray-400 truncate">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo Banners ───────────────────────────────── */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Khuyến mãi đang diễn ra</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {promoItems.map((promo) => (
              <div
                key={promo.label}
                className={`bg-white rounded-xl p-5 border ${promo.border} hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => setSelectedPromo(promo)}
              >
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${promo.tagColor} mb-3`}>
                  {promo.tag}
                </span>
                <h3 className="font-bold text-gray-800 text-lg leading-snug">{promo.label}</h3>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{promo.desc}</p>
                <button className={`mt-4 text-sm font-semibold ${promo.accent} hover:underline`}>
                  Xem chi tiết →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo Detail Dialog ─────────────────────────── */}
      <Dialog open={!!selectedPromo} onOpenChange={(open) => !open && setSelectedPromo(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedPromo && (
            <>
              <DialogHeader>
                <div className="mb-2">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${selectedPromo.tagColor}`}>
                    {selectedPromo.tag}
                  </span>
                </div>
                <DialogTitle className="text-xl">{selectedPromo.label}</DialogTitle>
                <DialogDescription className="text-sm pt-1">
                  {selectedPromo.desc}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Mã khuyến mãi */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${selectedPromo.accentBg} border ${selectedPromo.border}`}>
                  <div className="flex items-center gap-2">
                    <Tag className={`h-4 w-4 ${selectedPromo.accent}`} />
                    <span className="text-sm text-gray-600">Mã khuyến mãi</span>
                  </div>
                  <span className={`font-bold font-mono tracking-wider ${selectedPromo.accent}`}>
                    {selectedPromo.code}
                  </span>
                </div>

                {/* Hạn sử dụng */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarClock className="h-4 w-4 text-gray-400" />
                  <span>Hạn sử dụng: <strong className="text-gray-800">{selectedPromo.expiry}</strong></span>
                </div>

                {/* Điều kiện */}
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                    <Info className="h-4 w-4 text-gray-400" />
                    Điều kiện áp dụng
                  </div>
                  <ul className="space-y-1.5">
                    {selectedPromo.terms.map((term, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nút áp dụng */}
                <Button
                  className="w-full mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPromo.code);
                    toast.success(`Đã sao chép mã "${selectedPromo.code}"`);
                  }}
                >
                  Sao chép mã khuyến mãi
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Popular Routes ──────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-orange-500 text-sm font-semibold mb-1">
                <TrendingUp className="h-4 w-4" />
                Được đặt nhiều nhất
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Tuyến đường phổ biến</h2>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#1a3a8f] hover:text-orange-500 transition-colors"
            >
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.map((route) => (
              <Card
                key={`${route.from}-${route.to}`}
                className="cursor-pointer hover:shadow-xl hover:border-[#1a3a8f]/30 transition-all duration-300 group border border-gray-100 overflow-hidden"
                onClick={() => handleRouteClick(route.from, route.to)}
              >
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-[#1a3a8f]/5 to-[#1a3a8f]/10 px-5 pt-4 pb-3">
                    <div className="text-3xl mb-2">{route.emoji}</div>
                    <div className="font-bold text-gray-800 group-hover:text-[#1a3a8f] transition-colors text-sm">
                      {route.from}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs my-1">
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                      <ArrowRight className="h-3.5 w-3.5 text-[#1a3a8f]" />
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                    </div>
                    <div className="font-bold text-gray-800 group-hover:text-[#1a3a8f] transition-colors text-sm">
                      {route.to}
                    </div>
                  </div>
                  <div className="px-5 py-3 flex items-center justify-between bg-white">
                    <div>
                      <div className="text-orange-500 font-bold text-lg">{route.price}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {route.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{route.trips} chuyến/ngày</div>
                      <div className="mt-1 bg-[#1a3a8f]/10 group-hover:bg-[#1a3a8f] text-[#1a3a8f] group-hover:text-white text-xs font-semibold px-3 py-1 rounded-full transition-all">
                        Đặt ngay
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ───────────────────────────────── */}
      <section className="py-14 bg-gradient-to-br from-[#0a2463] to-[#1a3a8f]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="h-7 w-7 text-orange-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why VinaCoach ───────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-orange-500 text-sm font-semibold mb-2">
              <Star className="h-4 w-4 fill-orange-500" />
              Vì sao khách hàng yêu thích
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Tại sao chọn VinaCoach?</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bus, color: 'from-blue-500 to-indigo-600', title: 'Nhà xe chất lượng', desc: 'Hơn 50 tuyến đường toàn quốc, xe đời mới, tài xế kinh nghiệm.' },
              { icon: MapPin, color: 'from-green-500 to-teal-600', title: 'Đón trả tận nhà', desc: 'Xe đến đón tại địa chỉ của bạn, không cần ra bến xe.' },
              { icon: Clock, color: 'from-orange-500 to-amber-600', title: 'Đặt vé 60 giây', desc: 'Giao diện đơn giản, đặt vé cực nhanh bất cứ lúc nào.' },
              { icon: Shield, color: 'from-red-500 to-rose-600', title: 'Chắc chắn có chỗ', desc: 'Hoàn ngay 150% nếu nhà xe không cung cấp dịch vụ.' },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-base mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Chuyến đi tiếp theo của bạn?
          </h2>
          <p className="text-white/80 mb-7 text-lg">Hàng ngàn chuyến xe sẵn sàng — Đặt ngay hôm nay!</p>
          <button
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-2 bg-white text-orange-500 font-bold text-base px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Tìm chuyến xe ngay
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
