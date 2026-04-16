import { useState, useEffect } from 'react';
import { ticketService } from '@/services/ticket.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, MapPin, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Ticket as TicketType } from '@/types';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  PENDING: { label: 'Chờ thanh toán', variant: 'outline', className: 'border-orange-500 text-orange-600 bg-orange-50' },
  CONFIRMED: { label: 'Đã thanh toán', variant: 'default', className: 'bg-green-500 text-white' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive', className: '' },
  EXPIRED: { label: 'Hết hạn', variant: 'secondary', className: '' },
};

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const { data } = await ticketService.getMyTickets();
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

  const handleCancel = async (id: number) => {
    try {
      await ticketService.cancel(id);
      toast.success('Đã hủy vé thành công');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể hủy vé');
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Ticket className="h-8 w-8 text-primary/50" />
        </div>
        Đang tải...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        Vé của tôi
      </h1>

      {tickets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-10 w-10 text-primary/30" />
          </div>
          <p className="text-lg font-medium mb-1">Chưa có vé nào</p>
          <p className="text-sm">Hãy tìm và đặt chuyến xe đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const st = statusMap[t.status] || statusMap.PENDING;
            return (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        {t.trip?.schedule?.route?.origin}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        {t.trip?.schedule?.route?.destination}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {t.trip?.schedule?.departureTime} - {t.trip?.departureDate}
                        </span>
                        <span className="bg-muted px-2.5 py-1 rounded-md">
                          Số chỗ: <span className="font-medium text-foreground">{t.seatCount}</span>
                        </span>
                        <span className="bg-muted px-2.5 py-1 rounded-md">
                          Mã vé: <span className="font-medium text-foreground">#{t.id}</span>
                        </span>
                      </div>
                      <div className="text-sm mt-2 text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-green-500" />
                        {t.pickUpLocation}
                        <span className="mx-1">→</span>
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        {t.dropOffLocation}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(Number(t.totalPrice))}
                        </div>
                      </div>
                      <Badge variant={st.variant} className={st.className}>{st.label}</Badge>
                      {t.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(t.id)}
                          className="text-red-500 border-red-200 hover:bg-red-50"
                        >
                          Hủy vé
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
