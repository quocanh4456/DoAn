import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(email, password);
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Đăng nhập thành công!');

      if (data.user.role === 'Admin') navigate('/admin/dashboard');
      else if (data.user.role === 'Staff') navigate('/staff/trips');
      else navigate('/');
    } catch {
      toast.error('Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-border/50">

        {/* Left - Image */}
        <div className="relative hidden lg:block min-h-[600px]">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
            alt="Hành trình cùng VinaCoach"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bus className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">VinaCoach</span>
            </div>
            <p className="text-lg font-medium text-white/90 leading-relaxed">
              Đồng hành cùng bạn trên mọi hành trình
            </p>
            <p className="text-sm text-white/60 mt-2">
              Đặt vé xe khách trực tuyến – Nhanh chóng, tiện lợi, an toàn.
            </p>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="flex flex-col justify-center bg-card px-8 py-12 sm:px-12 lg:px-14">
          <div className="flex justify-center lg:justify-start mb-8 lg:hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Bus className="h-8 w-8 text-white" />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Đăng nhập</h1>
            <p className="text-muted-foreground mt-2">
              Đăng nhập vào hệ thống VinaCoach
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all duration-300 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Mật khẩu</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all duration-300 rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5" 
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline transition-all">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
