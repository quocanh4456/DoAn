import { useState } from 'react';
import { reportService } from '@/services/report.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { RevenueData, TripStat } from '@/types';
import dayjs from 'dayjs';

export function DashboardPage() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [tripStats, setTripStats] = useState<TripStat[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchData = async () => {
    try {
      const [revRes, tripRes] = await Promise.all([
        reportService.getRevenue(from, to),
        reportService.getTripStats(from, to),
      ]);
      setRevenue(revRes.data.details);
      setTotalRevenue(revRes.data.totalRevenue);
      setTripStats(tripRes.data);
      setLoaded(true);
    } catch {
      toast.error('Không thể tải dữ liệu báo cáo');
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const totalPassengers = tripStats.reduce((s, t) => s + t.passengerCount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Báo cáo & Thống kê</h1>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label>Từ ngày</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Đến ngày</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <Button onClick={fetchData}>
              <Search className="h-4 w-4 mr-1.5" />
              Xem báo cáo
            </Button>
          </div>
        </CardContent>
      </Card>

      {loaded && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-primary to-primary/80 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Tổng doanh thu</p>
                    <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Số chuyến xe</p>
                    <p className="text-2xl font-bold">{tripStats.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Tổng lượt khách</p>
                    <p className="text-2xl font-bold">{totalPassengers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Biểu đồ doanh thu theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(v) =>
                        new Intl.NumberFormat('vi-VN', {
                          notation: 'compact',
                        }).format(v)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => formatPrice(value)}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Bar dataKey="total" fill="oklch(0.546 0.19 264)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Không có dữ liệu doanh thu trong khoảng thời gian này
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê lượt khách theo chuyến xe</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tuyến</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ</TableHead>
                    <TableHead>Loại xe</TableHead>
                    <TableHead>Số vé</TableHead>
                    <TableHead>Lượt khách</TableHead>
                    <TableHead>Sức chứa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tripStats.map((t) => (
                    <TableRow key={t.tripId}>
                      <TableCell className="font-medium">{t.route}</TableCell>
                      <TableCell>{t.departureDate}</TableCell>
                      <TableCell>{t.departureTime}</TableCell>
                      <TableCell>{t.busType}</TableCell>
                      <TableCell>{t.ticketCount}</TableCell>
                      <TableCell>{t.passengerCount}</TableCell>
                      <TableCell>{t.totalSeats}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
