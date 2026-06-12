import { useState, useEffect, useCallback } from 'react';
import { reportService } from '@/services/report.service';
import { tripService } from '@/services/trip.service';
import type { ForecastResult, RouteInsight, RfmResult, LowDemandAlert } from '@/services/report.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Users, Ticket, Bus, Search, RefreshCw,
  DollarSign, CheckCircle2, Clock, CalendarDays, ArrowUpRight,
  ArrowDownRight, BarChart3, BrainCircuit, Sparkles, AlertTriangle,
  AlertCircle, Crown, Heart, Zap, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import type { RevenueData, TripStat } from '@/types';
import dayjs from 'dayjs';

// ── helpers ──────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v);

type Summary = {
  totalRevenue: number;
  todayRevenue: number;
  totalTickets: number;
  confirmedTickets: number;
  pendingTickets: number;
  totalCustomers: number;
  upcomingTrips: number;
};

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({
  title, value, sub, icon: Icon, gradient, badge, badgeColor,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Card className={`border-0 shadow-lg overflow-hidden ${gradient} text-white`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          {badge && (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: badgeColor || 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold leading-tight truncate">{value}</p>
        {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Status breakdown mini-bar ─────────────────────────────────────────
function StatusBar({ confirmed, pending, total }: { confirmed: number; pending: number; total: number }) {
  const cancelled = total - confirmed - pending;
  const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';
  return (
    <div className="space-y-2">
      {[
        { label: 'Đã thanh toán', value: confirmed, color: '#22c55e', bg: '#dcfce7' },
        { label: 'Chờ thanh toán', value: pending,   color: '#f59e0b', bg: '#fef3c7' },
        { label: 'Đã hủy / Hết hạn', value: cancelled < 0 ? 0 : cancelled, color: '#ef4444', bg: '#fee2e2' },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <div className="w-28 shrink-0 text-muted-foreground text-xs">{label}</div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: pct(value), background: color }} />
          </div>
          <div className="w-8 text-right text-xs font-semibold" style={{ color }}>{value}</div>
          <div className="w-8 text-xs text-muted-foreground">{pct(value)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Route occupancy table with mini bar ──────────────────────────────
function OccupancyRow({ t }: { t: TripStat }) {
  const pct = t.totalSeats > 0 ? Math.round((t.passengerCount / t.totalSeats) * 100) : 0;
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const hasBooking = t.ticketCount > 0;
  return (
    <TableRow className={`hover:bg-muted/40 transition-colors ${!hasBooking ? 'opacity-50' : ''}`}>
      <TableCell className="font-medium text-sm">
        <div>{t.route}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{t.departureDate} · {t.departureTime}</div>
      </TableCell>
      <TableCell>
        {hasBooking ? (
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-foreground">{t.passengerCount} ghế</span>
            <div className="text-xs text-muted-foreground">({t.ticketCount} giao dịch)</div>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground font-normal">Chưa có đặt</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className="text-xs font-medium" style={{ color }}>
            {t.passengerCount}/{t.totalSeats}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}


// ── MAIN COMPONENT ────────────────────────────────────────────────────
export function DashboardPage() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo]     = useState(dayjs().format('YYYY-MM-DD'));

  const [summary, setSummary]       = useState<Summary | null>(null);
  const [revenue, setRevenue]       = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [tripStats, setTripStats]   = useState<TripStat[]>([]);
  const [routeRev, setRouteRev]     = useState<any[]>([]);
  const [loaded, setLoaded]         = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingReport, setLoadingReport]   = useState(false);
  const [showAllTrips, setShowAllTrips]     = useState(false);
  const [activeTab, setActiveTab]           = useState<'report' | 'ai'>('report');

  // AI state
  const [forecast, setForecast]           = useState<ForecastResult | null>(null);
  const [routeInsights, setRouteInsights]  = useState<RouteInsight[]>([]);
  const [forecastDays, setForecastDays]   = useState<7 | 14 | 30>(14);
  const [rfmData, setRfmData]             = useState<RfmResult | null>(null);
  const [lowDemandAlerts, setLowDemandAlerts] = useState<LowDemandAlert[]>([]);
  const [loadingAI, setLoadingAI]         = useState(false);
  const [aiLoaded, setAiLoaded]           = useState(false);

  // Load KPI summary on mount
  useEffect(() => {
    reportService.getSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => toast.error('Không thể tải KPI tổng quan'))
      .finally(() => setLoadingSummary(false));
  }, []);

  const fetchReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const [revRes, tripRes, routeRes] = await Promise.all([
        reportService.getRevenue(from, to),
        reportService.getTripStats(from, to),
        reportService.getRouteRevenue(from, to),
      ]);
      setRevenue(revRes.data.details);
      setTotalRevenue(revRes.data.totalRevenue);
      setTripStats(tripRes.data);
      setRouteRev(routeRes.data);
      setLoaded(true);
    } catch {
      toast.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoadingReport(false);
    }
  }, [from, to]);

  // Also auto-load report for current month on mount
  useEffect(() => { fetchReport(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load AI forecast on mount
  const fetchAI = useCallback(async (days: 7 | 14 | 30 = forecastDays) => {
    setLoadingAI(true);
    try {
      const [fcRes, insRes, rfmRes, alertsRes] = await Promise.all([
        reportService.getForecast(days),
        reportService.getRouteInsights(),
        reportService.getRfmSegments(),
        reportService.getLowDemandAlerts(),
      ]);
      setForecast(fcRes.data);
      setRouteInsights(insRes.data);
      setRfmData(rfmRes.data);
      setLowDemandAlerts(alertsRes.data ?? []);
      setAiLoaded(true);
    } catch {
      toast.error('Không thể tải dữ liệu AI phân tích');
    } finally {
      setLoadingAI(false);
    }
  }, [forecastDays]);

  useEffect(() => { fetchAI(14); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPassengers = tripStats.reduce((s, t) => s + t.passengerCount, 0);

  // Sắp xếp: chuyến có người đặt lên trước, sau đó theo số vé giảm dần
  const sortedTripStats = [...tripStats].sort((a, b) => {
    if (b.ticketCount !== a.ticketCount) return b.ticketCount - a.ticketCount;
    return b.passengerCount - a.passengerCount;
  });
  const TRIP_LIMIT = 5;
  const visibleTrips = showAllTrips ? sortedTripStats : sortedTripStats.slice(0, TRIP_LIMIT);

  const PIE_COLORS = ['#1a3a8f', '#22c55e', '#f59e0b', '#ef4444'];

  const pieData = summary ? [
    { name: 'Đã thanh toán', value: summary.confirmedTickets },
    { name: 'Chờ TT', value: summary.pendingTickets },
    { name: 'Hủy/Hết hạn', value: Math.max(0, summary.totalTickets - summary.confirmedTickets - summary.pendingTickets) },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Tổng quan hệ thống VinaCoach · Cập nhật lúc {dayjs().format('HH:mm, DD/MM/YYYY')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoadingSummary(true);
            reportService.getSummary()
              .then(({ data }) => setSummary(data))
              .finally(() => setLoadingSummary(false));
            fetchReport();
          }}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-muted/60 rounded-xl p-1 w-fit border">
        {([
          { key: 'report', label: 'Báo cáo', icon: BarChart3 },
          { key: 'ai',     label: 'AI Phân tích', icon: BrainCircuit },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-foreground shadow-sm border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {key === 'ai' && lowDemandAlerts.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {lowDemandAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── KPI Cards (always visible) ── */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted border-0" />
          ))}
        </div>
      ) : summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Tổng doanh thu"
              value={fmtCompact(summary.totalRevenue) + ' ₫'}
              sub={`Hôm nay: ${fmtCompact(summary.todayRevenue)} ₫`}
              icon={DollarSign}
              gradient="bg-gradient-to-br from-[#1a3a8f] to-[#2a5bd7]"
              badge={summary.todayRevenue > 0 ? '↑ Hôm nay' : undefined}
            />
            <KpiCard
              title="Tổng vé xe"
              value={String(summary.totalTickets)}
              sub={`${summary.confirmedTickets} đã thanh toán`}
              icon={Ticket}
              gradient="bg-gradient-to-br from-green-500 to-green-600"
              badge={`${summary.pendingTickets} chờ TT`}
              badgeColor="rgba(0,0,0,0.2)"
            />
            <KpiCard
              title="Khách hàng"
              value={String(summary.totalCustomers)}
              sub="Tài khoản đã đăng ký"
              icon={Users}
              gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <KpiCard
              title="Chuyến sắp tới"
              value={String(summary.upcomingTrips)}
              sub="Đang lên lịch"
              icon={Bus}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </div>

          {/* ── Status breakdown + Pie ── */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Phân loại trạng thái vé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBar
                  confirmed={summary.confirmedTickets}
                  pending={summary.pendingTickets}
                  total={summary.totalTickets}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Tỉ lệ vé theo trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                        dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v} vé`, '']} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">Chưa có dữ liệu</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ══════════ TAB: BÁO CÁO ══════════ */}
      {activeTab === 'report' && (<>

      {/* ── Date range filter ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-sm" />
            </div>
            <Button onClick={fetchReport} disabled={loadingReport} size="sm" className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              {loadingReport ? 'Đang tải...' : 'Xem báo cáo'}
            </Button>
            {/* Quick filters */}
            {[
              { label: 'Tháng này', from: dayjs().startOf('month').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') },
              { label: '7 ngày qua', from: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') },
              { label: 'Hôm nay', from: dayjs().format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') },
            ].map(q => (
              <button key={q.label} type="button"
                onClick={() => {
                  setFrom(q.from);
                  setTo(q.to);
                  // Load báo cáo ngay với khoảng thời gian mới
                  setLoadingReport(true);
                  Promise.all([
                    reportService.getRevenue(q.from, q.to),
                    reportService.getTripStats(q.from, q.to),
                    reportService.getRouteRevenue(q.from, q.to),
                  ]).then(([revRes, tripRes, routeRes]) => {
                    setRevenue(revRes.data.details ?? []);
                    setTotalRevenue(revRes.data.totalRevenue ?? 0);
                    setTripStats(tripRes.data ?? []);
                    setRouteRev(routeRes.data ?? []);
                    setLoaded(true);
                    setShowAllTrips(false);
                  }).catch(() => {
                    toast.error('Không thể tải báo cáo');
                  }).finally(() => {
                    setLoadingReport(false);
                  });
                }}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {q.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Report sections ── */}
      {loaded && (
        <>
          {/* Revenue summary row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Doanh thu kỳ</p>
                <p className="text-xl font-bold text-primary">{fmt(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tổng lượt khách</p>
                <p className="text-xl font-bold text-green-600">{totalPassengers} khách</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 col-span-2 md:col-span-1">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Số chuyến trong kỳ</p>
                <p className="text-xl font-bold text-orange-500">{tripStats.length} chuyến</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Revenue area chart */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Doanh thu theo ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={revenue}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a3a8f" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#1a3a8f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={55} />
                      <Tooltip formatter={(v: number) => [fmt(v), 'Doanh thu']} labelFormatter={(l) => `Ngày ${l}`} />
                      <Area type="monotone" dataKey="total" stroke="#1a3a8f" strokeWidth={2}
                        fill="url(#revGrad)" dot={{ r: 3, fill: '#1a3a8f' }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12 text-sm">Không có dữ liệu trong khoảng này</p>
                )}
              </CardContent>
            </Card>

            {/* Route revenue bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  Doanh thu theo tuyến
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routeRev.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={routeRev} layout="vertical" barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tickFormatter={fmtCompact} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis type="category"
                        dataKey={(r: any) => `${r.origin?.slice(0,5)}→${r.destination?.slice(0,5)}`}
                        width={70} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => [fmt(v), 'Doanh thu']} />
                      <Bar dataKey="total" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12 text-sm">Không có dữ liệu</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trip stats table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bus className="h-4 w-4 text-primary" />
                Thống kê chuyến xe
                <Badge variant="secondary" className="ml-auto font-normal text-xs">
                  {sortedTripStats.filter(t => t.ticketCount > 0).length} có đặt / {sortedTripStats.length} chuyến
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sortedTripStats.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Tuyến · Ngày · Giờ</TableHead>
                        <TableHead className="text-xs font-semibold">Số ghế đặt</TableHead>
                        <TableHead className="text-xs font-semibold">Lấp đầy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleTrips.map((t) => <OccupancyRow key={t.tripId} t={t} />)}
                    </TableBody>
                  </Table>
                  {sortedTripStats.length > TRIP_LIMIT && (
                    <div className="flex justify-center py-3 border-t">
                      <button
                        type="button"
                        onClick={() => setShowAllTrips((v) => !v)}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        {showAllTrips
                          ? `↑ Thu gọn`
                          : `↓ Xem thêm ${sortedTripStats.length - TRIP_LIMIT} chuyến`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-10 text-sm">Không có chuyến xe trong khoảng này</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
      </>)}

      {activeTab === 'ai' && (
      <>
      <div className="mt-2">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">AI Phân tích & Dự báo</h2>
              <p className="text-xs text-muted-foreground">Powered by Weighted Moving Average + Linear Regression</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Forecast day selector */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setForecastDays(d);
                    fetchAI(d);
                  }}
                  className={`text-xs px-3 py-1 rounded-md transition-all font-medium ${
                    forecastDays === d
                      ? 'bg-white shadow text-purple-700'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d} ngày
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAI(forecastDays)}
              disabled={loadingAI}
              className="gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
              Cập nhật
            </Button>
          </div>
        </div>

        {loadingAI && !aiLoaded ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-24 animate-pulse bg-gradient-to-br from-purple-50 to-violet-50 border-0" />
            ))}
          </div>
        ) : aiLoaded && forecast ? (
          <>
            {/* AI KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {/* Xu hướng */}
              <Card className="border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      {forecast.trend === 'up'
                        ? <TrendingUp className="h-4 w-4" />
                        : forecast.trend === 'down'
                        ? <TrendingDown className="h-4 w-4" />
                        : <Minus className="h-4 w-4" />}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20">AI</span>
                  </div>
                  <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Xu hướng</p>
                  <p className="text-xl font-bold">
                    {forecast.trend === 'up' ? '↑ Tăng trưởng' : forecast.trend === 'down' ? '↓ Suy giảm' : '→ Ổn định'}
                  </p>
                </CardContent>
              </Card>

              {/* Tốc độ tăng trưởng */}
              <Card className="border-0 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20">30 ngày</span>
                  </div>
                  <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Tăng trưởng</p>
                  <p className="text-xl font-bold">
                    {forecast.growthRate >= 0 ? '+' : ''}{forecast.growthRate}%
                  </p>
                  <p className="text-white/60 text-xs">So với 30 ngày trước</p>
                </CardContent>
              </Card>

              {/* Dự báo tổng */}
              <Card className="border-0 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20">{forecastDays}d</span>
                  </div>
                  <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Dự báo DT</p>
                  <p className="text-xl font-bold leading-tight">{fmtCompact(forecast.forecastTotal)} ₫</p>
                  <p className="text-white/60 text-xs">{forecastDays} ngày tới</p>
                </CardContent>
              </Card>

              {/* Slope */}
              <Card className="border-0 bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Tốc độ/ngày</p>
                  <p className="text-xl font-bold">
                    {forecast.slope >= 0 ? '+' : ''}{fmtCompact(forecast.slope)} ₫
                  </p>
                  <p className="text-white/60 text-xs">Thay đổi trung bình/ngày</p>
                </CardContent>
              </Card>
            </div>

            {/* Forecast Chart */}
            <Card className="mb-4 border border-purple-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-purple-600" />
                  Doanh thu lịch sử & Dự báo {forecastDays} ngày tới
                  <Badge variant="outline" className="ml-auto text-xs text-purple-600 border-purple-200 font-normal">
                    ── Thực tế &nbsp;&nbsp; ╌╌ Dự báo
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const todayStr = dayjs().format('YYYY-MM-DD');
                  const chartData = [
                    ...forecast.historical.map((d) => ({
                      date: d.date.slice(5),   // MM-DD
                      actual: d.revenue,
                      predicted: undefined as number | undefined,
                      isForecast: false,
                    })),
                    ...forecast.forecast.map((d) => ({
                      date: d.date.slice(5),
                      actual: undefined as number | undefined,
                      predicted: d.revenue,
                      isForecast: true,
                      isHoliday: d.isHoliday,
                    })),
                  ];
                  return (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          interval={Math.floor(chartData.length / 8)}
                        />
                        <YAxis
                          tickFormatter={fmtCompact}
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={55}
                        />
                        <Tooltip
                          formatter={(v: number, name: string) => [fmt(v), name === 'actual' ? 'Thực tế' : 'Dự báo']}
                          labelFormatter={(l) => `Ngày ${l}`}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <ReferenceLine x={dayjs().format('MM-DD')} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: 'Hôm nay', position: 'top', fontSize: 10, fill: '#7c3aed' }} />
                        <Area type="monotone" dataKey="actual" stroke="#7c3aed" strokeWidth={2}
                          fill="url(#actualGrad)" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                        <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2}
                          strokeDasharray="6 3" fill="url(#forecastGrad)"
                          dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Route Insights Table */}
            {routeInsights.length > 0 && (
              <Card className="border border-purple-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Phân tích Tuyến đường — Khuyến nghị AI
                    <Badge variant="secondary" className="ml-auto font-normal text-xs">
                      {routeInsights.length} tuyến · 90 ngày qua
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-purple-50/60">
                        <TableHead className="text-xs font-semibold">Tuyến</TableHead>
                        <TableHead className="text-xs font-semibold">Số chuyến</TableHead>
                        <TableHead className="text-xs font-semibold">Lấp đầy TB</TableHead>
                        <TableHead className="text-xs font-semibold">Doanh thu/chuyến</TableHead>
                        <TableHead className="text-xs font-semibold">Cao điểm</TableHead>
                        <TableHead className="text-xs font-semibold">Khuyến nghị AI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routeInsights.map((r) => {
                        const occColor = r.avgOccupancy >= 80 ? '#22c55e' : r.avgOccupancy >= 50 ? '#f59e0b' : '#ef4444';
                        return (
                          <TableRow key={r.routeId} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-sm">{r.route}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{r.tripCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${r.avgOccupancy}%`, background: occColor }} />
                                </div>
                                <span className="text-xs font-medium" style={{ color: occColor }}>{r.avgOccupancy}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-purple-700">
                              {fmtCompact(r.revenuePerTrip)} ₫
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">{r.peakDay}</Badge>
                            </TableCell>
                            <TableCell>
                              <RecommendationBadge color={r.recommendationColor} label={r.recommendationLabel} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>

        {/* ── Low-Demand Alerts ── */}
        <Card className={`border-l-4 ${lowDemandAlerts.length > 0 ? 'border-l-red-400' : 'border-l-green-400'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${lowDemandAlerts.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
              Cảnh báo chuyến ít khách
              {lowDemandAlerts.length > 0 ? (
                <Badge className="ml-auto bg-red-100 text-red-700 border-red-200 font-medium text-xs">
                  {lowDemandAlerts.length} chuyến cần chú ý
                </Badge>
              ) : (
                <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 font-medium text-xs">
                  Tất cả tốt ✓
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAI ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : lowDemandAlerts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
                <p className="text-sm font-medium text-green-700">Không có chuyến nào cần cảnh báo</p>
                <p className="text-xs text-muted-foreground">Tất cả chuyến trong 14 ngày tới đều đạt tỷ lệ lấp đầy kỳ vọng</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {lowDemandAlerts.map((alert) => {
                  const severityConfig = {
                    high:   { bg: 'bg-red-50 border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    label: 'Nghiêm trọng' },
                    medium: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', label: 'Trung bình' },
                    low:    { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700',  badge: 'bg-yellow-100 text-yellow-700', label: 'Nhẹ' },
                  }[alert.severity];
                  return (
                    <div key={alert.tripId} className={`flex items-center gap-4 p-3 rounded-xl border ${severityConfig.bg}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${severityConfig.text}`}>{alert.route}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severityConfig.badge}`}>{severityConfig.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>📅 {dayjs(alert.departureDate).format('DD/MM/YYYY')} {alert.departureTime}</span>
                          <span>🪑 {alert.bookedSeats}/{alert.totalSeats} ghế</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-500">{alert.currentOccupancy}%</div>
                          <div className="text-[10px] text-muted-foreground">Hiện tại</div>
                        </div>
                        <div className="text-muted-foreground text-sm">vs</div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{alert.expectedOccupancy}%</div>
                          <div className="text-[10px] text-muted-foreground">Kỳ vọng</div>
                        </div>
                        {alert.suggestedDiscount > 0 && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await tripService.applyDiscount(alert.tripId, alert.suggestedDiscount);
                                toast.success(`Đã áp dụng giảm ${alert.suggestedDiscount}% cho chuyến ${alert.route}`);
                                fetchAI(forecastDays);
                              } catch (err: any) {
                                toast.error(err?.response?.data?.message || 'Không thể áp dụng giảm giá');
                              }
                            }}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Tag className="h-3 w-3" />
                            Giảm {alert.suggestedDiscount}%
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RFM Customer Segmentation ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              Phân tích khách hàng RFM
              <span className="text-xs font-normal text-muted-foreground ml-1">(Recency · Frequency · Monetary)</span>
              {rfmData && (
                <Badge variant="secondary" className="ml-auto text-xs font-normal">
                  {rfmData.segments.length} khách hàng
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAI ? (
              <div className="h-40 animate-pulse bg-muted rounded-lg" />
            ) : rfmData ? (
              <div className="space-y-5">
                {/* Segment summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'VIP', count: rfmData.summary.vip,       icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
                    { label: 'Trung thành', count: rfmData.summary.loyal,  icon: Heart, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
                    { label: 'Tiềm năng', count: rfmData.summary.potential, icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                    { label: 'Cần kích cầu', count: rfmData.summary.needBoost, icon: Zap, color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
                  ].map(({ label, count, icon: Icon, color, bg }) => (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${bg}`}>
                      <Icon className={`h-5 w-5 ${color} shrink-0`} />
                      <div>
                        <div className={`text-xl font-bold ${color}`}>{count}</div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* RFM Table */}
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Khách hàng</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Phân khúc</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Gần đây (R)</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Tần suất (F)</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Chi tiêu (M)</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Điểm</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfmData.segments.slice(0, 10).map((c) => {
                        const segStyle = {
                          gold:  'bg-yellow-100 text-yellow-800 border-yellow-200',
                          blue:  'bg-blue-100 text-blue-800 border-blue-200',
                          green: 'bg-green-100 text-green-800 border-green-200',
                          red:   'bg-red-100 text-red-800 border-red-200',
                        }[c.segmentColor];
                        return (
                          <TableRow key={c.userId} className="hover:bg-muted/40 transition-colors">
                            <TableCell>
                              <div className="font-medium text-sm">{c.name || '—'}</div>
                              <div className="text-xs text-muted-foreground">{c.email}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${segStyle}`}>
                                {c.segmentIcon} {c.segment}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {c.recencyDays} ngày
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium">
                              {c.frequency} vé
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-violet-700">
                              {fmtCompact(c.monetary)} ₫
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                                {c.totalScore}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {rfmData.segments.length > 10 && (
                    <div className="py-2 text-center text-xs text-muted-foreground border-t">
                      Hiển thị 10/{rfmData.segments.length} khách hàng
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10 text-sm">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </>
      )}
    </div>
  );
}


// ── AI Recommendation Badge ───────────────────────────────────────────
function RecommendationBadge({ color, label }: { color: 'green' | 'orange' | 'red'; label: string }) {
  const styles = {
    green: 'bg-green-100 text-green-700 border-green-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };
  const icons = {
    green: '🟢',
    orange: '🟠',
    red: '🔴',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[color]}`}>
      {icons[color]} {label}
    </span>
  );
}
