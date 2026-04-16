import { useState, useEffect } from 'react';
import { busService } from '@/services/bus.service';
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Bus } from '@/types';

export function ManageBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState({
    licensePlate: '',
    busType: 'Ghế ngồi',
    totalSeats: 16,
  });

  const fetchBuses = async () => {
    const { data } = await busService.getAll(search);
    setBuses(data);
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBuses();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ licensePlate: '', busType: 'Ghế ngồi', totalSeats: 16 });
    setOpen(true);
  };

  const openEdit = (bus: Bus) => {
    setEditing(bus);
    setForm({
      licensePlate: bus.licensePlate,
      busType: bus.busType,
      totalSeats: bus.totalSeats,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await busService.update(editing.id, form);
        toast.success('Cập nhật phương tiện thành công');
      } else {
        await busService.create(form);
        toast.success('Thêm phương tiện thành công');
      }
      setOpen(false);
      fetchBuses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa phương tiện này?')) return;
    try {
      await busService.remove(id);
      toast.success('Đã xóa phương tiện');
      fetchBuses();
    } catch {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý phương tiện</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm xe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Cập nhật phương tiện' : 'Thêm phương tiện mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Biển số xe</Label>
                <Input
                  value={form.licensePlate}
                  onChange={(e) =>
                    setForm({ ...form, licensePlate: e.target.value })
                  }
                  placeholder="VD: 51B-123.45"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Loại xe</Label>
                <Select
                  value={form.busType}
                  onValueChange={(v) => setForm({ ...form, busType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ghế ngồi">Ghế ngồi</SelectItem>
                    <SelectItem value="Giường nằm">Giường nằm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tổng số ghế</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.totalSeats}
                  onChange={(e) =>
                    setForm({ ...form, totalSeats: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editing ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="Tìm theo biển số..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Biển số</TableHead>
              <TableHead>Loại xe</TableHead>
              <TableHead>Số ghế</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buses.map((bus) => (
              <TableRow key={bus.id}>
                <TableCell>{bus.id}</TableCell>
                <TableCell className="font-medium">{bus.licensePlate}</TableCell>
                <TableCell>{bus.busType}</TableCell>
                <TableCell>{bus.totalSeats}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(bus)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(bus.id)}
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
