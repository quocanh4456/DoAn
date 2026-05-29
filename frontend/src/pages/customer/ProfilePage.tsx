import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User, Mail, Phone, Shield, Calendar,
  Edit3, Save, X, CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  role: { id: number; name: string };
}

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Quản trị viên',
  Staff: 'Nhân viên',
  Customer: 'Khách hàng',
};

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-red-100 text-red-700',
  Staff: 'bg-blue-100 text-blue-700',
  Customer: 'bg-green-100 text-green-700',
};

export function ProfilePage() {
  const { user: storeUser, login } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    authService.getMyProfile()
      .then(({ data }) => {
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone);
      })
      .catch(() => toast.error('Không thể tải thông tin'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSaving(true);
    try {
      const { data } = await authService.updateMyProfile({ fullName, phone });
      setProfile((p) => p ? { ...p, fullName: data.fullName, phone: data.phone } : p);
      // Cập nhật store để header hiển thị tên mới
      if (storeUser) {
        login({ ...storeUser, fullName: data.fullName }, localStorage.getItem('accessToken') || '', localStorage.getItem('refreshToken') || '');
      }
      setEditing(false);
      toast.success('Cập nhật thông tin thành công!');
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone);
    }
    setEditing(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const roleName = profile.role?.name ?? '';

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-5">

      {/* ── Avatar / Header card ─────────────────────────────── */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#1a3a8f] to-[#2a5bd7]" />
        <CardContent className="pt-0 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30 flex items-center justify-center text-white text-3xl font-bold border-4 border-background">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_COLORS[roleName] ?? 'bg-gray-100 text-gray-700'}`}>
                {ROLE_LABELS[roleName] ?? roleName}
              </span>
              {profile.isActive && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Hoạt động
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{profile.fullName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{profile.email}</p>
        </CardContent>
      </Card>

      {/* ── Thông tin chi tiết ───────────────────────────────── */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Thông tin cá nhân
          </CardTitle>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-1.5 h-8 text-xs"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Chỉnh sửa
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {editing ? (
            /* ── Chế độ chỉnh sửa ─── */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-fullname">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11"
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11"
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={profile.email}
                    className="pl-10 h-11 bg-muted cursor-not-allowed text-muted-foreground"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1 gap-1.5" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1 gap-1.5">
                  <X className="h-4 w-4" />
                  Hủy
                </Button>
              </div>
            </form>
          ) : (
            /* ── Chế độ xem ─── */
            <div className="space-y-0 divide-y divide-border">
              {[
                { icon: User,     label: 'Họ và tên',         value: profile.fullName },
                { icon: Mail,     label: 'Email',              value: profile.email },
                { icon: Phone,    label: 'Số điện thoại',     value: profile.phone },
                { icon: Shield,   label: 'Vai trò',            value: ROLE_LABELS[roleName] ?? roleName },
                { icon: Calendar, label: 'Ngày tham gia',      value: formatDate(profile.createdAt) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bảo mật ─────────────────────────────────────────── */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Bảo mật tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/customer/change-password">
            <Button variant="outline" className="w-full justify-start gap-2 h-11">
              🔑 Đổi mật khẩu
            </Button>
          </Link>
        </CardContent>
      </Card>

    </div>
  );
}
