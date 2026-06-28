import { useState, useEffect } from 'react';
import { reportService } from '@/services/report.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Banknote, Ticket as TicketIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ShiftReport {
  tickets: any[];
  totalTickets: number;
  totalRevenue: number;
}

export function ShiftReportPage() {
  const [report, setReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await reportService.getShiftReport();
      setReport(data);
    } catch {
      toast.error('Không thể tải báo cáo ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Báo cáo ca làm việc (Hôm nay)</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-sm border-0 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số vé thu tiền mặt
            </CardTitle>
            <TicketIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {loading ? '-' : report?.totalTickets}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Các vé được thu trong hôm nay
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng tiền mặt đã thu
            </CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {loading ? '-' : formatPrice(report?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Doanh thu cần bàn giao
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-base">Chi tiết thu tiền</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã vé</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Chuyến đi</TableHead>
                  <TableHead>SĐT Khách</TableHead>
                  <TableHead className="text-right">Số tiền thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : !report || report.tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Chưa có khoản thu tiền mặt nào trong hôm nay.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell>{ticket.user?.fullName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ticket.trip?.schedule?.route?.origin} → {ticket.trip?.schedule?.route?.destination}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.user?.phone}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        +{formatPrice(ticket.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
