import { useState, useEffect } from 'react';
import { ticketService } from '@/services/ticket.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, RefreshCcw, Eye, MapPin, Bus, User, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Ticket } from '@/types';

export function ManageTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const handleCancelTicket = async (id: number) => {
    const reason = window.prompt('Nhập lý do hủy vé (bắt buộc):');
    if (reason === null) return; // User clicked Cancel
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do hủy vé');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn hủy vé này không? Hành động này sẽ hoàn lại chỗ trống cho chuyến đi.')) return;
    try {
      await ticketService.cancel(id, reason);
      toast.success('Hủy vé thành công!');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi hủy vé');
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
                      <div className="text-sm font-medium">{ticket.guestName || ticket.user?.fullName || 'Khách vãng lai'}</div>
                      <div className="text-xs text-muted-foreground">{ticket.guestPhone || ticket.guestEmail || ticket.user?.phone || ticket.user?.email || ''}</div>
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
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsDetailsOpen(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </Button>
                      {ticket.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelTicket(ticket.id)}
                            className="gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmCash(ticket.id)}
                            className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Thu tiền
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Ticket Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết vé #{selectedTicket?.id}</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về chuyến đi và khách hàng
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-2">
              {/* Status & Price */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-semibold uppercase">Tổng tiền</div>
                  <div className="font-bold text-lg text-primary">{formatPrice(selectedTicket.totalPrice)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1 font-semibold uppercase">Trạng thái</div>
                  {selectedTicket.status === 'CONFIRMED' && <Badge className="bg-green-100 text-green-700">Đã thanh toán</Badge>}
                  {selectedTicket.status === 'PENDING' && <Badge className="bg-yellow-100 text-yellow-700">Chờ thanh toán</Badge>}
                  {selectedTicket.status === 'CANCELLED' && <Badge className="bg-red-100 text-red-700">Đã hủy</Badge>}
                  {selectedTicket.status === 'EXPIRED' && <Badge className="bg-gray-100 text-gray-700">Hết hạn</Badge>}
                </div>
              </div>

              {/* Cancellation Reason if any */}
              {selectedTicket.status === 'CANCELLED' && selectedTicket.cancelReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  <span className="font-semibold block mb-1">Lý do hủy:</span>
                  {selectedTicket.cancelReason}
                </div>
              )}

              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" /> Thông tin khách hàng
                </h4>
                <div className="bg-white border rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Họ tên:</span>
                    <span className="font-medium">{selectedTicket.guestName || selectedTicket.user?.fullName || 'Khách vãng lai'}</span>
                  </div>
                  {(selectedTicket.guestPhone || selectedTicket.user?.phone) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số điện thoại:</span>
                      <span className="font-medium">{selectedTicket.guestPhone || selectedTicket.user?.phone}</span>
                    </div>
                  )}
                  {(selectedTicket.guestEmail || selectedTicket.user?.email) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedTicket.guestEmail || selectedTicket.user?.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trip Info */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Bus className="h-4 w-4 text-orange-500" /> Thông tin chuyến đi
                </h4>
                <div className="bg-white border rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tuyến:</span>
                    <span className="font-medium text-right">{selectedTicket.trip?.schedule?.route?.origin} → {selectedTicket.trip?.schedule?.route?.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày khởi hành:</span>
                    <span className="font-medium">{new Date(selectedTicket.trip?.departureDate || '').toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giờ khởi hành:</span>
                    <span className="font-medium">{selectedTicket.trip?.schedule?.departureTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Xe:</span>
                    <span className="font-medium">{selectedTicket.trip?.bus?.busType} ({selectedTicket.trip?.bus?.licensePlate || 'Chưa gán'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số lượng ghế:</span>
                    <span className="font-medium">{selectedTicket.seatCount} chỗ</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" /> Điểm đón / trả
                </h4>
                <div className="bg-white border rounded-lg p-3 space-y-3 text-sm">
                  <div>
                    <span className="text-[11px] text-green-600 font-bold block mb-1">ĐIỂM ĐÓN</span>
                    <span className="font-medium">{selectedTicket.pickUpLocation}</span>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-[11px] text-red-600 font-bold block mb-1">ĐIỂM TRẢ</span>
                    <span className="font-medium">{selectedTicket.dropOffLocation}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
