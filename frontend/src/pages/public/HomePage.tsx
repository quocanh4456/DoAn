import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bus,
  MapPin,
  Shield,
  Clock,
  CreditCard,
  Headphones,
  CheckCircle,
  ArrowRight,
  CalendarDays,
  Navigation,
} from 'lucide-react';

const popularRoutes = [
  { from: 'TP. Hồ Chí Minh', to: 'Đà Lạt', price: '250.000đ', time: '~7 tiếng', img: '🏔️' },
  { from: 'TP. Hồ Chí Minh', to: 'Nha Trang', price: '300.000đ', time: '~9 tiếng', img: '🏖️' },
  { from: 'TP. Hồ Chí Minh', to: 'Vũng Tàu', price: '150.000đ', time: '~2.5 tiếng', img: '⛱️' },
  { from: 'TP. Hồ Chí Minh', to: 'Cần Thơ', price: '180.000đ', time: '~3.5 tiếng', img: '🌾' },
  { from: 'Hà Nội', to: 'Sapa', price: '350.000đ', time: '~6 tiếng', img: '🌿' },
  { from: 'Đà Nẵng', to: 'Huế', price: '100.000đ', time: '~2.5 tiếng', img: '🏛️' },
];

export function HomePage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    if (date) params.set('date', date);
    navigate(`/search?${params.toString()}`);
  };

  const handleRouteClick = (from: string, to: string) => {
    const params = new URLSearchParams();
    params.set('origin', from);
    params.set('destination', to);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Đặt vé xe khách trực tuyến
          </h1>
          <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Dịch vụ xe cỡ nhỏ & trung chất lượng cao. Đón và trả tận nhà,
            an toàn, tiện lợi, minh bạch giá vé.
          </p>

          <Card className="max-w-4xl mx-auto shadow-2xl border-0">
            <CardContent className="p-5 md:p-7">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full text-left">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <MapPin className="h-3.5 w-3.5 inline mr-1 text-primary" />
                    Nơi xuất phát
                  </label>
                  <Input
                    placeholder="VD: TP. Hồ Chí Minh"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex-1 w-full text-left">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <Navigation className="h-3.5 w-3.5 inline mr-1 text-red-500" />
                    Nơi đến
                  </label>
                  <Input
                    placeholder="VD: Đà Lạt"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex-1 w-full text-left">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <CalendarDays className="h-3.5 w-3.5 inline mr-1 text-primary" />
                    Ngày đi
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button type="submit" size="lg" className="h-11 px-8 text-base font-semibold shrink-0 w-full md:w-auto">
                  Tìm chuyến
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x">
            {[
              { icon: CheckCircle, label: 'Chắc chắn có chỗ', color: 'text-green-500' },
              { icon: Headphones, label: 'Hỗ trợ 24/7', color: 'text-orange-500' },
              { icon: CreditCard, label: 'Nhiều ưu đãi', color: 'text-red-500' },
              { icon: Shield, label: 'Thanh toán an toàn', color: 'text-primary' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-center gap-2.5 py-4">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">Tuyến đường phổ biến</h2>
          <p className="text-muted-foreground mb-8">Các tuyến đường được khách hàng yêu thích nhất</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.map((route) => (
              <Card
                key={`${route.from}-${route.to}`}
                className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
                onClick={() => handleRouteClick(route.from, route.to)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="text-4xl">{route.img}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {route.from} → {route.to}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-primary font-bold text-base">{route.price}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {route.time}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why VinaCoach */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-2">Tại sao chọn VinaCoach?</h2>
          <p className="text-muted-foreground text-center mb-10">Nền tảng kết nối người dùng và nhà xe</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bus className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">Nhà xe chất lượng</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Hơn 50 tuyến đường trên toàn quốc, chủ động và đa dạng lựa chọn.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="font-semibold text-base mb-2">Đón trả tận nhà</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Xe đón và trả tận nơi, không cần di chuyển ra bến xe.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-7 w-7 text-orange-500" />
                </div>
                <h3 className="font-semibold text-base mb-2">Đặt vé dễ dàng</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Đặt vé chỉ với 60s. Chọn xe yêu thích cực nhanh và thuận tiện.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="font-semibold text-base mb-2">Chắc chắn có chỗ</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Hoàn ngay 150% nếu nhà xe không cung cấp dịch vụ vận chuyển.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
