import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (oldPassword === newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      toast.success('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const EyeButton = ({
    show,
    toggle,
  }: {
    show: boolean;
    toggle: () => void;
  }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Card className="shadow-xl border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Đổi mật khẩu</CardTitle>
              <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="old-password">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="old-password"
                  type={showOld ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <EyeButton show={showOld} toggle={() => setShowOld((v) => !v)} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
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
                  <EyeButton show={showNew} toggle={() => setShowNew((v) => !v)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <EyeButton show={showConfirm} toggle={() => setShowConfirm((v) => !v)} />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    ✗ Mật khẩu xác nhận không khớp
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    ✓ Mật khẩu khớp
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </form>

          <div className="mt-5 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Gợi ý mật khẩu an toàn:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Ít nhất 8 ký tự</li>
              <li>Kết hợp chữ hoa, chữ thường và số</li>
              <li>Không dùng thông tin cá nhân (tên, ngày sinh...)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
