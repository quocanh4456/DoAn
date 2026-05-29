import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-primary/5 to-background">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <p className="font-semibold text-foreground">Link không hợp lệ</p>
            <p className="text-sm text-muted-foreground">
              Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </p>
            <Link to="/forgot-password">
              <Button className="mt-2">Yêu cầu link mới</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Token không hợp lệ hoặc đã hết hạn';
      toast.error(msg);
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
          <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
          <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn</CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Đặt lại thành công!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay.
                </p>
              </div>
              <Button className="w-full h-11" onClick={() => navigate('/login')}>
                Đăng nhập ngay
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mật khẩu mới */}
              <div className="space-y-2">
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Mật khẩu xác nhận không khớp</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Yêu cầu link mới
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
