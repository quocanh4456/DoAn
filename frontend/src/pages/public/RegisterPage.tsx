import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Mail, Lock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch {
      toast.error('Đăng ký thất bại. Email có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-primary/5 to-background">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Bus className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Đăng ký</CardTitle>
          <CardDescription>
            Tạo tài khoản VinaCoach để đặt vé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={handleChange}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={handleChange}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </form>
          <p className="text-center text-sm mt-6 text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
