import { useState, useEffect } from 'react';
import { scheduleService } from '@/services/schedule.service';
import { routeService } from '@/services/route.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, MapPin, Clock, Route as RouteIcon, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Schedule, Route } from '@/types';

export function ManageSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filterRouteId, setFilterRouteId] = useState<string>('all');
  const [searchTime, setSearchTime] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ routeId: '', departureTime: '' });

  // State cho chức năng sửa
  const [editOpen, setEditOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editForm, setEditForm] = useState({ routeId: '', departureTime: '' });

  const fetchSchedules = async () => {
    const routeId = filterRouteId !== 'all' ? Number(filterRouteId) : undefined;
    const { data } = await scheduleService.getAll(routeId);
    setSchedules(data);
  };

  useEffect(() => {
    routeService.getAll().then(({ data }) => setRoutes(data));
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [filterRouteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleService.create({
        routeId: Number(form.routeId),
        departureTime: form.departureTime,
      });
      toast.success('Thêm khung giờ thành công');
      setOpen(false);
      fetchSchedules();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Thao tác thất bại';
      toast.error(msg);
    }
  };

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditForm({
      routeId: String(schedule.routeId),
      departureTime: schedule.departureTime.slice(0, 5), // HH:mm
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      await scheduleService.update(editingSchedule.id, {
        routeId: Number(editForm.routeId),
        departureTime: editForm.departureTime,
      });
      toast.success('Cập nhật khung giờ thành công');
      setEditOpen(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Cập nhật thất bại';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa khung giờ này?')) return;
    try {
      await scheduleService.remove(id);
      toast.success('Đã xóa');
      fetchSchedules();
    } catch {
      toast.error('Không thể xóa');
    }
  };

  // Helper: lấy tên tuyến từ ID
  const getRouteName = (routeId: string) => {
    if (routeId === 'all') return 'Tất cả tuyến';
    const r = routes.find((r) => String(r.id) === routeId);
    return r ? `${r.origin} → ${r.destination}` : `Tuyến #${routeId}`;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý khung giờ</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm khung giờ
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm khung giờ mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tuyến đường</Label>
                <select
                  value={form.routeId}
                  onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>Chọn tuyến đường</option>
                  {routes.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.origin} → {r.destination} ({r.distance} km — {formatPrice(Number(r.basePrice))})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Giờ xuất bến</Label>
                <Input
                  type="time"
                  value={form.departureTime}
                  onChange={(e) =>
                    setForm({ ...form, departureTime: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Thêm
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterRouteId}
          onChange={(e) => setFilterRouteId(e.target.value)}
          className="flex h-10 w-80 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">🗂️ Tất cả tuyến</option>
          {routes.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.origin} → {r.destination}
            </option>
          ))}
        </select>

        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="time"
            value={searchTime}
            onChange={(e) => setSearchTime(e.target.value)}
            placeholder="Lọc theo giờ"
            className="h-10 w-44 pl-9 pr-8"
          />
          {searchTime && (
            <button
              type="button"
              onClick={() => setSearchTime('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {(filterRouteId !== 'all' || searchTime) && (
          <button
            type="button"
            onClick={() => { setFilterRouteId('all'); setSearchTime(''); }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tuyến đường</TableHead>
              <TableHead>Khoảng cách</TableHead>
              <TableHead>Giá vé cơ bản</TableHead>
              <TableHead>Giờ xuất bến</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const filtered = searchTime
                ? schedules.filter((s) => s.departureTime.startsWith(searchTime))
                : schedules;
              return filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Không có khung giờ nào{searchTime ? ` lúc ${searchTime}` : ''}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        {s.route
                          ? `${s.route.origin} → ${s.route.destination}`
                          : `Tuyến #${s.routeId}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <RouteIcon className="h-3.5 w-3.5" />
                      {s.route?.distance ? `${s.route.distance} km` : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      {s.route?.basePrice ? formatPrice(Number(s.route.basePrice)) : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      <span className="font-semibold">{s.departureTime}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(s)}
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            );
            })()}
          </TableBody>
        </Table>
      </div>

      {/* Dialog sửa khung giờ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa khung giờ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tuyến đường</Label>
              <select
                value={editForm.routeId}
                onChange={(e) => setEditForm({ ...editForm, routeId: e.target.value })}
                required
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>Chọn tuyến đường</option>
                {routes.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.origin} → {r.destination} ({r.distance} km — {formatPrice(Number(r.basePrice))})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Giờ xuất bến</Label>
              <Input
                type="time"
                value={editForm.departureTime}
                onChange={(e) =>
                  setEditForm({ ...editForm, departureTime: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Lưu thay đổi
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
