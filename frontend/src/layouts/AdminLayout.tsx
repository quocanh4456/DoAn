import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

const staffLinks = [
  { to: '/staff/routes', icon: MapPin, label: 'Tuyến đường' },
  { to: '/staff/schedules', icon: Clock, label: 'Khung giờ' },
  { to: '/staff/trips', icon: Navigation, label: 'Chuyến đi' },
  { to: '/staff/counter-booking', icon: Ticket, label: 'Đặt vé tại quầy' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: BarChart3, label: 'Báo cáo' },
  { to: '/admin/buses', icon: Bus, label: 'Phương tiện' },
  { to: '/admin/users', icon: Users, label: 'Nhân sự' },
  { to: '/staff/routes', icon: MapPin, label: 'Tuyến đường' },
  { to: '/staff/schedules', icon: Clock, label: 'Khung giờ' },
  { to: '/staff/trips', icon: Navigation, label: 'Chuyến đi' },
  { to: '/staff/counter-booking', icon: Ticket, label: 'Đặt vé tại quầy' },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const links = user?.role === 'Admin' ? adminLinks : staffLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="bg-sidebar-primary rounded-lg p-1.5">
              <Bus className="h-5 w-5 text-white" />
            </div>
            VinaCoach
          </Link>
          <p className="text-xs text-sidebar-foreground/60 mt-1.5 ml-9">
            {user?.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-sidebar-primary text-white font-medium shadow-md'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-white text-sm font-semibold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-white">{user?.fullName}</div>
              <div className="text-xs text-sidebar-foreground/50">{user?.email}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-transparent border-sidebar-border text-sidebar-foreground/70 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
