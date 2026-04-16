import { useState, useEffect } from 'react';
import { scheduleService } from '@/services/schedule.service';
import { routeService } from '@/services/route.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Schedule, Route } from '@/types';

export function ManageSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filterRouteId, setFilterRouteId] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ routeId: '', departureTime: '' });

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
    } catch {
      toast.error('Thao tác thất bại');
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý khung giờ</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm khung giờ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm khung giờ mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tuyến đường</Label>
                <Select
                  value={form.routeId}
                  onValueChange={(v) => setForm({ ...form, routeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tuyến" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.origin} → {r.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      <div className="mb-4">
        <Select value={filterRouteId} onValueChange={setFilterRouteId}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Lọc theo tuyến" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tuyến</SelectItem>
            {routes.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.origin} → {r.destination}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tuyến đường</TableHead>
              <TableHead>Giờ xuất bến</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>
                  {s.route
                    ? `${s.route.origin} → ${s.route.destination}`
                    : `Tuyến #${s.routeId}`}
                </TableCell>
                <TableCell>{s.departureTime}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
