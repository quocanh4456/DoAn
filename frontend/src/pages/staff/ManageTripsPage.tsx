import { useState, useEffect } from 'react';
import { tripService } from '@/services/trip.service';
import { scheduleService } from '@/services/schedule.service';
import { busService } from '@/services/bus.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import type { Trip, Schedule, Bus } from '@/types';

export function ManageTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    scheduleId: '',
    busId: '',
    driverName: '',
    departureDate: '',
  });

  const fetchTrips = async () => {
    const { data } = await tripService.getAll();
    setTrips(data);
  };

  useEffect(() => {
    fetchTrips();
    scheduleService.getAll().then(({ data }) => setSchedules(data));
    busService.getAll().then(({ data }) => setBuses(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tripService.create({
        scheduleId: Number(form.scheduleId),
        busId: Number(form.busId),
        driverName: form.driverName,
        departureDate: form.departureDate,
      });
      toast.success('Tạo chuyến đi thành công');
      setOpen(false);
      fetchTrips();
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy chuyến đi này?')) return;
    try {
      await tripService.remove(id);
      toast.success('Đã hủy chuyến');
      fetchTrips();
    } catch {
      toast.error('Không thể hủy');
    }
  };

  const statusColor: Record<string, 'default' | 'secondary' | 'destructive'> = {
    SCHEDULED: 'default',
    COMPLETED: 'secondary',
    CANCELLED: 'destructive',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý chuyến đi</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo chuyến
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo chuyến đi mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Khung giờ</Label>
                <Select
                  value={form.scheduleId}
                  onValueChange={(v) => setForm({ ...form, scheduleId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khung giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.route
                          ? `${s.route.origin}→${s.route.destination}`
                          : `#${s.id}`}{' '}
                        | {s.departureTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Xe</Label>
                <Select
                  value={form.busId}
                  onValueChange={(v) => setForm({ ...form, busId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.licensePlate} - {b.busType} ({b.totalSeats} chỗ)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tên tài xế</Label>
                <Input
                  placeholder="VD: Trần Văn B"
                  value={form.driverName}
                  onChange={(e) =>
                    setForm({ ...form, driverName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày khởi hành</Label>
                <Input
                  type="date"
                  value={form.departureDate}
                  onChange={(e) =>
                    setForm({ ...form, departureDate: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Tạo chuyến
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tuyến đường</TableHead>
              <TableHead>Giờ</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Xe</TableHead>
              <TableHead>Tài xế</TableHead>
              <TableHead>Chỗ trống</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>{trip.id}</TableCell>
                <TableCell>
                  {trip.schedule?.route?.origin} → {trip.schedule?.route?.destination}
                </TableCell>
                <TableCell>{trip.schedule?.departureTime}</TableCell>
                <TableCell>{trip.departureDate}</TableCell>
                <TableCell>
                  {trip.bus?.licensePlate} ({trip.bus?.busType})
                </TableCell>
                <TableCell>{trip.driverName}</TableCell>
                <TableCell>
                  {trip.availableSeats}/{trip.bus?.totalSeats}
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor[trip.status] || 'secondary'}>
                    {trip.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(trip.id)}
                    disabled={trip.status === 'CANCELLED'}
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
