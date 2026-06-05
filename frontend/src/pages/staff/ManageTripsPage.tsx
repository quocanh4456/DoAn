import { useState, useEffect, useMemo } from 'react';
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
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';
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

  // Search & filter
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho dialog sửa chuyến
  const [editOpen, setEditOpen] = useState(false);
  const [editTripId, setEditTripId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    scheduleId: '',
    busId: '',
    driverName: '',
    departureDate: '',
  });

  // State cho dialog hủy chuyến
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTripId, setCancelTripId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchTrips = async () => {
    const { data } = await tripService.getAll();
    setTrips(data);
  };

  // Filter & search logic
  const filteredTrips = useMemo(() => {
    let result = trips;

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Search by text (route, driver, license plate, date, trip ID)
    const q = searchText.trim().toLowerCase();
    if (q) {
      result = result.filter((trip) => {
        const route = `${trip.schedule?.route?.origin ?? ''} ${trip.schedule?.route?.destination ?? ''}`.toLowerCase();
        const driver = (trip.driverName ?? '').toLowerCase();
        const plate = (trip.bus?.licensePlate ?? '').toLowerCase();
        const date = (trip.departureDate ?? '').toLowerCase();
        const id = String(trip.id);
        return (
          route.includes(q) ||
          driver.includes(q) ||
          plate.includes(q) ||
          date.includes(q) ||
          id.includes(q)
        );
      });
    }

    return result;
  }, [trips, searchText, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  // Pagination logic (on filtered results)
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / itemsPerPage));
  const paginatedTrips = filteredTrips.slice(
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

  const openEditDialog = (trip: Trip) => {
    setEditTripId(trip.id);
    setEditForm({
      scheduleId: String(trip.scheduleId ?? trip.schedule?.id ?? ''),
      busId: String(trip.busId ?? trip.bus?.id ?? ''),
      driverName: trip.driverName ?? '',
      departureDate: typeof trip.departureDate === 'string'
        ? trip.departureDate.slice(0, 10)
        : '',
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTripId) return;
    setLoading(true);
    try {
      await tripService.update(editTripId, {
        scheduleId: Number(editForm.scheduleId),
        busId: Number(editForm.busId),
        driverName: editForm.driverName,
        departureDate: editForm.departureDate,
      });
      toast.success('Cập nhật chuyến đi thành công');
      setEditOpen(false);
      setEditTripId(null);
      fetchTrips();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Cập nhật thất bại';
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

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tuyến, tài xế, biển số, ngày..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
        {(searchText || statusFilter !== 'ALL') && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredTrips.length} / {trips.length} chuyến
          </span>
        )}
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
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(trip)}
                      disabled={trip.status !== 'SCHEDULED'}
                      title="Sửa chuyến"
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCancelDialog(trip.id)}
                      disabled={trip.status === 'CANCELLED'}
                      title="Hủy chuyến"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
          <span>/ {filteredTrips.length} chuyến</span>
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

      {/* Dialog sửa chuyến */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa chuyến đi #{editTripId}</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chuyến đi. Chỉ sửa được chuyến đang ở trạng thái "Đã lên lịch".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Khung giờ</Label>
              <Select
                value={editForm.scheduleId}
                onValueChange={(v) => setEditForm({ ...editForm, scheduleId: v })}
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
                value={editForm.busId}
                onValueChange={(v) => setEditForm({ ...editForm, busId: v })}
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
                value={editForm.driverName}
                onChange={(e) =>
                  setEditForm({ ...editForm, driverName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày khởi hành</Label>
              <Input
                type="date"
                value={editForm.departureDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, departureDate: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
