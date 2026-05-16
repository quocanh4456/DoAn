import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import {
  Bus, LogOut, User, Ticket, Phone, Search,
  ChevronDown, Settings, LayoutDashboard, Info, HelpCircle,
} from 'lucide-react';
import { ChatWidget } from '@/components/ChatWidget';

export function GuestLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Single slim Vexere-style header ───────────────── */}
      <header className="bg-[#1a3a8f] text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-3">

            {/* Left: logo + cam kết */}
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="bg-orange-500 group-hover:bg-orange-400 rounded-lg p-1.5 transition-colors">
                  <Bus className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-white hidden sm:block">
                  Vina<span className="text-orange-400">Coach</span>
                </span>
              </Link>

              <span className="hidden lg:block text-white/25">|</span>

              <div className="hidden lg:flex items-center gap-1.5 text-xs text-white/70 min-w-0">
                <span className="truncate">
                  Cam kết hoàn 150% nếu nhà xe không cung cấp dịch vụ vận chuyển
                </span>
                <Info className="h-3.5 w-3.5 text-white/40 shrink-0" />
              </div>
            </div>

            {/* Right: nav links + actions */}
            <div className="flex items-center gap-1 shrink-0">



              {(user?.role === 'Staff' || user?.role === 'Admin') && (
                <Link
                  to={user?.role === 'Admin' ? '/admin/dashboard' : '/staff/trips'}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
                >
                  {user?.role === 'Admin'
                    ? <LayoutDashboard className="h-3.5 w-3.5" />
                    : <Settings className="h-3.5 w-3.5" />
                  }
                  Quản trị
                </Link>
              )}

              <a
                href="#"
                className="hidden xl:flex items-center px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
              >
                Mở bán vé
              </a>

              <a
                href="#"
                className="hidden xl:flex items-center px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
              >
                Trở thành đối tác
              </a>

              {/* Divider */}
              <div className="hidden md:block w-px h-5 bg-white/20 mx-1" />

              {/* Help */}
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                title="Trợ giúp"
              >
                <HelpCircle className="h-4 w-4 text-white/60" />
              </button>

              {/* Hotline */}
              <a
                href="tel:19000000"
                className="hidden sm:flex items-center gap-1.5 border border-white/35 hover:border-white hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all whitespace-nowrap"
              >
                <Phone className="h-3.5 w-3.5" />
                Hotline 24/7
              </a>

              {/* Auth */}
              {isAuthenticated && user ? (
                <div className="relative ml-1" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium max-w-[90px] truncate hidden sm:block">
                      {user.fullName}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-gradient-to-br from-[#1a3a8f]/5 to-[#1a3a8f]/10 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Đã đăng nhập với</p>
                        <p className="font-semibold text-gray-800 truncate text-sm">{user.fullName}</p>
                        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                      </div>
                      <div className="py-1">
                        {user.role === 'Customer' && (
                          <Link
                            to="/customer/tickets"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a3a8f] transition-colors"
                          >
                            <Ticket className="h-4 w-4" />
                            Đơn hàng của tôi
                          </Link>
                        )}
                        {(user.role === 'Staff' || user.role === 'Admin') && (
                          <Link
                            to={user.role === 'Admin' ? '/admin/dashboard' : '/staff/trips'}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a3a8f] transition-colors"
                          >
                            {user.role === 'Admin'
                              ? <LayoutDashboard className="h-4 w-4" />
                              : <Settings className="h-4 w-4" />
                            }
                            Quản trị hệ thống
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 ml-1">
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/90 hover:text-white hover:bg-white/10 border border-white/30 text-xs h-8 px-3 rounded-lg"
                    >
                      <User className="h-3.5 w-3.5 mr-1" />
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold h-8 px-3 rounded-lg shadow-md shadow-orange-500/30"
                    >
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  );
}
