import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import {
  Bus,
  MapPin,
  Clock,
  Navigation,
  Ticket,
  BarChart3,
  Users,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  ClipboardList,
  Banknote,
} from 'lucide-react';

// ── Link groups ───────────────────────────────────────────────────────

const adminGroups = [
  {
    label: 'Tổng quan',
    links: [
      { to: '/admin/dashboard', icon: BarChart3, label: 'Báo cáo & Dashboard' },
    ],
  },
  {
    label: 'Quản lý',
    links: [
      { to: '/admin/buses',          icon: Bus,        label: 'Phương tiện' },
      { to: '/admin/users',          icon: Users,      label: 'Nhân sự' },
      { to: '/staff/routes',         icon: MapPin,     label: 'Tuyến đường' },
      { to: '/staff/schedules',      icon: Clock,      label: 'Khung giờ' },
      { to: '/staff/trips',          icon: Navigation, label: 'Chuyến đi' },
      { to: '/staff/counter-booking', icon: Ticket,     label: 'Đặt vé online' },
      { to: '/staff/tickets',        icon: ClipboardList, label: 'Quản lý vé' },
      { to: '/staff/shift-report',   icon: Banknote,   label: 'Doanh thu ca' },
    ],
  },
];

const staffGroups = [
  {
    label: 'Nghiệp vụ',
    links: [
      { to: '/staff/routes',          icon: MapPin,     label: 'Tuyến đường' },
      { to: '/staff/schedules',       icon: Clock,      label: 'Khung giờ' },
      { to: '/staff/trips',           icon: Navigation, label: 'Chuyến đi' },
      { to: '/staff/counter-booking', icon: Ticket,     label: 'Đặt vé online' },
      { to: '/staff/tickets',         icon: ClipboardList, label: 'Quản lý vé' },
      { to: '/staff/shift-report',    icon: Banknote,   label: 'Doanh thu ca' },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const groups = user?.role === 'Admin' ? adminGroups : staffGroups;
  const isAdmin = user?.role === 'Admin';
  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() ?? 'U';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-[#f0f4ff]">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="relative flex flex-col shadow-2xl transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? '72px' : '256px',
          background: 'linear-gradient(180deg, #0f2461 0%, #1a3a8f 60%, #1e45a8 100%)',
          minHeight: '100vh',
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-[#1a3a8f] hover:bg-orange-50 hover:border-orange-300 transition-all"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft  className="h-3.5 w-3.5" />
          }
        </button>

        {/* ── Logo / Brand ── */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        >
          <Link to="/" className="flex items-center gap-3 min-w-0 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 group-hover:bg-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/40 transition-colors shrink-0">
              <Bus className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-bold text-white leading-tight text-base whitespace-nowrap">
                  Vina<span className="text-orange-400">Coach</span>
                </p>
                <p className="text-[10px] text-white/50 whitespace-nowrap">Hệ thống quản lý</p>
              </div>
            )}
          </Link>
        </div>

        {/* ── Role badge ── */}
        {!collapsed && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {isAdmin
              ? <Shield className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              : <UserCog className="h-3.5 w-3.5 text-blue-300 shrink-0" />
            }
            <span className="text-xs font-semibold text-white/80">
              {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
            </span>
          </div>
        )}

        {/* ── Nav Groups ── */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-thin">
          {groups.map((group) => (
            <div key={group.label} className="mt-2">
              {/* Group label */}
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 px-3 mb-1 mt-2">
                  {group.label}
                </p>
              )}
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = location.pathname === link.to ||
                  (link.to !== '/' && location.pathname.startsWith(link.to));
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    title={collapsed ? link.label : undefined}
                    className={`
                      relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
                      font-medium transition-all duration-200 group overflow-hidden
                      ${active
                        ? 'bg-white text-[#1a3a8f] shadow-lg shadow-black/20'
                        : 'text-white/65 hover:text-white hover:bg-white/10'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                  >
                    {/* Active left bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-orange-500" />
                    )}
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#1a3a8f]' : ''}`} />
                    {!collapsed && (
                      <span className="truncate leading-none">{link.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── User Footer ── */}
        <div
          className="mt-auto px-3 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.10)' }}
        >
          {/* User info */}
          {!collapsed && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-3"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user?.fullName ?? 'Người dùng'}
                </p>
                <p className="text-[11px] text-white/45 truncate">{user?.email}</p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center mb-3">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow"
                title={user?.fullName}
              >
                {initials}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={`flex gap-2 ${collapsed ? 'flex-col items-center' : ''}`}>
            <Link
              to="/"
              title="Về trang chủ"
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                text-white/60 hover:text-white hover:bg-white/10 transition-all
                ${collapsed ? 'justify-center w-10' : 'flex-1'}
              `}
            >
              <Home className="h-4 w-4 shrink-0" />
              {!collapsed && 'Trang chủ'}
            </Link>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                text-white/60 hover:text-red-300 hover:bg-red-500/15 transition-all
                ${collapsed ? 'justify-center w-10' : ''}
              `}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && 'Đăng xuất'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 h-14 flex items-center px-6 gap-3"
          style={{
            background: 'rgba(240,244,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(26,58,143,0.08)',
          }}
        >
          <div className="flex items-center gap-2 text-sm text-[#1a3a8f]/60">
            <Bus className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-[#1a3a8f]">VinaCoach</span>
            <span className="text-[#1a3a8f]/30">/</span>
            <span>
              {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400">Đang hoạt động</span>
          </div>
        </div>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
