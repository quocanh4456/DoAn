import { useState, useEffect } from 'react';
import { ticketService } from '@/services/ticket.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Ticket } from '@/types';

export function ManageTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await ticketService.getAll(search);
      setTickets(data);
    } catch {
      toast.error('Không thể tải danh sách vé');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleConfirmCash = async (id: number) => {
    if (!confirm('Xác nhận đã thu tiền mặt cho vé này?')) return;
    try {
      await ticketService.confirmCash(id);
      toast.success('Xác nhận thành công!');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý vé</h1>
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
          <Input
            placeholder="Tìm theo mã, SĐT, tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã vé</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Chuyến đi</TableHead>
                <TableHead>Số chỗ</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Không tìm thấy vé nào.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{ticket.user?.fullName}</div>
                      <div className="text-xs text-muted-foreground">{ticket.user?.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {ticket.trip?.schedule?.route?.origin} → {ticket.trip?.schedule?.route?.destination}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ticket.trip?.schedule?.departureTime} - {new Date(ticket.trip?.departureDate || '').toLocaleDateString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.seatCount}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatPrice(ticket.totalPrice)}
                    </TableCell>
                    <TableCell>
                      {ticket.status === 'CONFIRMED' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đã thanh toán</Badge>}
                      {ticket.status === 'PENDING' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Chờ thanh toán</Badge>}
                      {ticket.status === 'CANCELLED' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Đã hủy</Badge>}
                      {ticket.status === 'EXPIRED' && <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Hết hạn</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {ticket.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmCash(ticket.id)}
                          className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Xác nhận tiền mặt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
