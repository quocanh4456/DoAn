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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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

  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho dialog hủy chuyến
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTripId, setCancelTripId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchTrips = async () => {
    const { data } = await tripService.getAll();
    setTrips(data);
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(trips.length / itemsPerPage));
  const paginatedTrips = trips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchTrips();
    scheduleService.getAll().then(({ data }) => setSchedules(data));
    busService.getAll().then(({ data }) => setBuses(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Thao tác thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openCancelDialog = (id: number) => {
    setCancelTripId(id);
    setCancelReason('');
    setCancelOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelTripId) return;
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy chuyến');
      return;
    }
    try {
      await tripService.remove(cancelTripId, cancelReason.trim());
      toast.success('Đã hủy chuyến');
      setCancelOpen(false);
      setCancelTripId(null);
      setCancelReason('');
      fetchTrips();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể hủy';
      toast.error(msg);
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
                  <SelectTrigger className="w-full">
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
                  <SelectTrigger className="w-full">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo chuyến'}
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
            {paginatedTrips.map((trip) => (
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
                  <div className="flex flex-col gap-1">
                    <Badge variant={statusColor[trip.status] || 'secondary'}>
                      {trip.status}
                    </Badge>
                    {trip.status === 'CANCELLED' && trip.cancelReason && (
                      <span className="text-xs text-muted-foreground italic max-w-[200px] truncate" title={trip.cancelReason}>
                        Lý do: {trip.cancelReason}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openCancelDialog(trip.id)}
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

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Hiển thị</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>/ {trips.length} chuyến</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-2">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog hủy chuyến */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy chuyến đi</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do hủy chuyến để tiếp tục.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Lý do hủy chuyến <span className="text-destructive">*</span></Label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="VD: Xe bị hỏng, thời tiết xấu, không đủ khách..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Đóng
            </Button>
            <Button variant="destructive" onClick={handleCancelSubmit}>
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
