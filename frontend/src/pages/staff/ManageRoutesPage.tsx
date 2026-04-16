import { useState, useEffect } from 'react';
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Route } from '@/types';

export function ManageRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    distance: 0,
    basePrice: 0,
  });

  const fetchRoutes = async () => {
    const { data } = await routeService.getAll(search);
    setRoutes(data);
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRoutes();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ origin: '', destination: '', distance: 0, basePrice: 0 });
    setOpen(true);
  };

  const openEdit = (route: Route) => {
    setEditing(route);
    setForm({
      origin: route.origin,
      destination: route.destination,
      distance: route.distance,
      basePrice: route.basePrice,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await routeService.update(editing.id, form);
        toast.success('Cập nhật tuyến đường thành công');
      } else {
        await routeService.create(form);
        toast.success('Thêm tuyến đường thành công');
      }
      setOpen(false);
      fetchRoutes();
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tuyến đường này?')) return;
    try {
      await routeService.remove(id);
      toast.success('Đã xóa tuyến đường');
      fetchRoutes();
    } catch {
      toast.error('Không thể xóa');
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý tuyến đường</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm tuyến
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Cập nhật tuyến đường' : 'Thêm tuyến đường mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Điểm đi</Label>
                <Input
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Điểm đến</Label>
                <Input
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Khoảng cách (km)</Label>
                <Input
                  type="number"
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Giá vé cơ bản (VNĐ)</Label>
                <Input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
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
          placeholder="Tìm theo điểm đi/đến..."
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
              <TableHead>Điểm đi</TableHead>
              <TableHead>Điểm đến</TableHead>
              <TableHead>Khoảng cách</TableHead>
              <TableHead>Giá vé</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell>{route.id}</TableCell>
                <TableCell>{route.origin}</TableCell>
                <TableCell>{route.destination}</TableCell>
                <TableCell>{route.distance} km</TableCell>
                <TableCell>{formatPrice(route.basePrice)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(route)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(route.id)}
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
