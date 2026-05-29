import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
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
          <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
          <CardDescription>
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Kiểm tra hộp thư!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nếu email <span className="font-medium text-foreground">{email}</span> tồn tại trong hệ thống,
                  bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Không thấy email? Kiểm tra thư mục Spam hoặc{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  thử lại
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
