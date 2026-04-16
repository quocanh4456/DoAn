import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Bus, LogOut, User, Ticket, Phone, Mail, MapPin, Search } from 'lucide-react';

export function GuestLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary/95 text-primary-foreground/80 text-xs py-1.5 hidden md:block">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Hotline: 1900 0000
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              support@vinacoach.vn
            </span>
          </div>
          <span>Cam kết hoàn 150% nếu nhà xe không cung cấp dịch vụ vận chuyển</span>
        </div>
      </div>

      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-white">
            <div className="bg-white/20 rounded-lg p-1.5">
              <Bus className="h-5 w-5" />
            </div>
            VinaCoach
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/search">
              <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/15">
                <Search className="h-4 w-4 mr-1.5" />
                Tìm chuyến xe
              </Button>
            </Link>

            {isAuthenticated && user ? (
              <>
                {user.role === 'Customer' && (
                  <Link to="/customer/tickets">
                    <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/15">
                      <Ticket className="h-4 w-4 mr-1" />
                      Vé của tôi
                    </Button>
                  </Link>
                )}
                {(user.role === 'Staff' || user.role === 'Admin') && (
                  <Link to={user.role === 'Admin' ? '/admin/dashboard' : '/staff/trips'}>
                    <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/15">
                      Quản trị
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 ml-2 bg-white/15 rounded-lg px-3 py-1.5">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.fullName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white/80 hover:text-white hover:bg-white/15"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/15 border border-white/30">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-white text-primary hover:bg-white/90 font-semibold">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-primary/95 text-primary-foreground mt-auto">
        <div className="container mx-auto px-4 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-4">
                <Bus className="h-5 w-5" />
                VinaCoach
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Hệ thống đặt vé xe khách trực tuyến hàng đầu Việt Nam.
                Dịch vụ xe cỡ nhỏ & trung chất lượng cao.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Về VinaCoach</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Giới thiệu</li>
                <li>Quy chế hoạt động</li>
                <li>Chính sách bảo mật</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Hướng dẫn đặt vé</li>
                <li>Chính sách đổi/trả vé</li>
                <li>Câu hỏi thường gặp</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> 1900 0000
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> support@vinacoach.vn
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> TP. Hồ Chí Minh, Việt Nam
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm text-white/60">
            &copy; 2026 VinaCoach. Hệ thống đặt vé xe khách trực tuyến.
          </div>
        </div>
      </footer>
    </div>
  );
}
