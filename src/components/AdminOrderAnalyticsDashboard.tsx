import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  ShoppingBag,
  DollarSign,
  Activity,
  BarChart2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  CheckCircle2,
  Flame,
  Info
} from 'lucide-react';

interface AdminOrderAnalyticsDashboardProps {
  orders: Order[];
  onSelectOrder?: (orderId: string) => void;
}

type TimeRange = '7d' | '14d' | '30d' | 'all';
type MetricView = 'volume' | 'dual' | 'cumulative';

interface DailyDataPoint {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  orderCount: number;
  revenue: number;
  cumulativeCount: number;
  cumulativeRevenue: number;
  completedCount: number;
  processingCount: number;
  orders: Order[];
}

export const AdminOrderAnalyticsDashboard: React.FC<AdminOrderAnalyticsDashboardProps> = ({
  orders
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [metricView, setMetricView] = useState<MetricView>('volume');
  const [hoveredPoint, setHoveredPoint] = useState<DailyDataPoint | null>(null);

  // Parse and aggregate order dates
  const { chartData, metrics, dayOfWeekStats } = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        chartData: [],
        metrics: {
          totalInRange: 0,
          revenueInRange: 0,
          dailyAverage: 0,
          peakDay: null as DailyDataPoint | null,
          todayCount: 0,
          growthRate: 0
        },
        dayOfWeekStats: []
      };
    }

    // Determine the date boundary
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Find earliest order date
    const orderDates = orders
      .map(o => new Date(o.createdAt || o.updatedAt || Date.now()).getTime())
      .filter(t => !isNaN(t));

    const earliestTimestamp = orderDates.length > 0 ? Math.min(...orderDates) : now.getTime();

    let daysToInclude = 14;
    if (timeRange === '7d') daysToInclude = 7;
    else if (timeRange === '14d') daysToInclude = 14;
    else if (timeRange === '30d') daysToInclude = 30;
    else {
      // 'all': calculate days between earliest order and today + at least 7 days
      const daysDiff = Math.max(7, Math.ceil((now.getTime() - earliestTimestamp) / (1000 * 60 * 60 * 24)) + 1);
      daysToInclude = Math.min(90, daysDiff);
    }

    // Generate continuous date array
    const dateMap = new Map<string, Order[]>();
    const dateKeys: string[] = [];

    for (let i = daysToInclude - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      dateKeys.push(isoKey);
      dateMap.set(isoKey, []);
    }

    // Populate with actual orders
    orders.forEach(ord => {
      try {
        const orderDate = new Date(ord.createdAt || ord.updatedAt || Date.now());
        if (!isNaN(orderDate.getTime())) {
          const isoKey = orderDate.toISOString().split('T')[0];
          if (dateMap.has(isoKey)) {
            dateMap.get(isoKey)!.push(ord);
          } else if (timeRange === 'all' && isoKey <= todayStr) {
            dateMap.set(isoKey, [ord]);
            if (!dateKeys.includes(isoKey)) {
              dateKeys.push(isoKey);
            }
          }
        }
      } catch {
        // skip invalid dates
      }
    });

    // Sort dateKeys chronologically
    dateKeys.sort();

    // Build timeline points with cumulative sums
    let runningTotalCount = 0;
    let runningTotalRevenue = 0;

    const dataPoints: DailyDataPoint[] = dateKeys.map(dateKey => {
      const dayOrders = dateMap.get(dateKey) || [];
      const orderCount = dayOrders.length;
      const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const completedCount = dayOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
      const processingCount = dayOrders.filter(o => o.status === 'Processing' || o.status === 'Paid / New').length;

      runningTotalCount += orderCount;
      runningTotalRevenue += revenue;

      const [year, month, day] = dateKey.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        date: dateKey,
        formattedDate,
        dayOfWeek,
        orderCount,
        revenue: Number(revenue.toFixed(2)),
        cumulativeCount: runningTotalCount,
        cumulativeRevenue: Number(runningTotalRevenue.toFixed(2)),
        completedCount,
        processingCount,
        orders: dayOrders
      };
    });

    // Compute key metrics
    const totalInRange = dataPoints.reduce((acc, p) => acc + p.orderCount, 0);
    const revenueInRange = dataPoints.reduce((acc, p) => acc + p.revenue, 0);
    const dailyAverage = totalInRange / (dataPoints.length || 1);

    // Find peak day
    let peakDay: DailyDataPoint | null = null;
    dataPoints.forEach(p => {
      if (!peakDay || p.orderCount > peakDay.orderCount) {
        peakDay = p;
      }
    });

    // Today's orders
    const todayPoint = dataPoints.find(p => p.date === todayStr);
    const todayCount = todayPoint ? todayPoint.orderCount : 0;

    // Traffic growth rate comparing first half vs second half of the selected range
    const halfLen = Math.floor(dataPoints.length / 2);
    const firstHalfCount = dataPoints.slice(0, halfLen).reduce((acc, p) => acc + p.orderCount, 0);
    const secondHalfCount = dataPoints.slice(halfLen).reduce((acc, p) => acc + p.orderCount, 0);
    const growthRate = firstHalfCount > 0 
      ? Math.round(((secondHalfCount - firstHalfCount) / firstHalfCount) * 100)
      : secondHalfCount > 0 ? 100 : 0;

    // Traffic by Day of Week (Sun-Sat)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = weekdays.map(dayName => {
      const matching = dataPoints.filter(p => p.dayOfWeek === dayName);
      const count = matching.reduce((acc, p) => acc + p.orderCount, 0);
      const rev = matching.reduce((acc, p) => acc + p.revenue, 0);
      return {
        dayName,
        count,
        revenue: rev
      };
    });

    return {
      chartData: dataPoints,
      metrics: {
        totalInRange,
        revenueInRange: Number(revenueInRange.toFixed(2)),
        dailyAverage: Number(dailyAverage.toFixed(1)),
        peakDay,
        todayCount,
        growthRate
      },
      dayOfWeekStats: dayStats
    };
  }, [orders, timeRange]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyDataPoint = payload[0].payload;
      return (
        <div className="bg-[#0B132B] text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-2 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {data.formattedDate} ({data.dayOfWeek})
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">{data.date}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                New Orders:
              </span>
              <span className="font-bold font-mono text-white text-sm">
                {data.orderCount} {data.orderCount === 1 ? 'order' : 'orders'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Daily Revenue:
              </span>
              <span className="font-bold font-mono text-emerald-400">
                ${data.revenue.toFixed(2)}
              </span>
            </div>

            {data.cumulativeCount > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Cumulative:</span>
                <span className="font-mono text-slate-300">
                  {data.cumulativeCount} orders (${data.cumulativeRevenue.toFixed(0)})
                </span>
              </div>
            )}
          </div>

          {data.orders.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800 text-[10.5px] text-slate-400">
              <span className="text-slate-500 block mb-0.5">Top vehicle models:</span>
              <div className="truncate max-w-[190px] font-mono text-slate-300">
                {data.orders.slice(0, 2).map(o => `${o.vehicle.make} ${o.vehicle.model}`).join(', ')}
                {data.orders.length > 2 && ` +${data.orders.length - 2} more`}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header Bar with Title, Range Filters & Metric Views */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Order Volume & Traffic Patterns
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Daily order volume distribution over time to monitor customer checkout cadence.
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Time Range Buttons & Metric View Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Metric View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMetricView('volume')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'volume'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume Only
            </button>
            <button
              type="button"
              onClick={() => setMetricView('dual')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'dual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume & Revenue
            </button>
            <button
              type="button"
              onClick={() => setMetricView('cumulative')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'cumulative'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cumulative
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            {(['7d', '14d', '30d', 'all'] as TimeRange[]).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-[#0B132B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orders in Selected Range */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orders in Range</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 font-mono">{metrics.totalInRange}</p>
            <span className={`text-[11px] font-bold flex items-center gap-0.5 ${
              metrics.growthRate >= 0 ? 'text-[#059669]' : 'text-rose-600'
            }`}>
              {metrics.growthRate >= 0 ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{metrics.growthRate}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{metrics.growthRate}%</span>
                </>
              )}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400">Total checkouts captured</p>
        </div>

        {/* Daily Average Velocity */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Daily Average</span>
            <Activity className="w-4 h-4 text-[#FB2C36]" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {metrics.dailyAverage}
            <span className="text-xs font-normal text-slate-500 ml-1">orders/day</span>
          </p>
          <p className="text-[10.5px] text-slate-400">Average daily run rate</p>
        </div>

        {/* Peak Day Traffic */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peak Traffic Day</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {metrics.peakDay?.orderCount || 0}
            <span className="text-xs font-normal text-slate-500 ml-1">orders</span>
          </p>
          <p className="text-[10.5px] text-slate-400 truncate">
            {metrics.peakDay ? `${metrics.peakDay.formattedDate} (${metrics.peakDay.dayOfWeek})` : 'No peak data'}
          </p>
        </div>

        {/* Revenue Generated */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Range Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#059669] font-mono">
            ${metrics.revenueInRange.toFixed(2)}
          </p>
          <p className="text-[10.5px] text-slate-400">Gross total USD processed</p>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Daily Order Velocity Timeline</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {timeRange.toUpperCase()}
              </span>
            </h4>
            <span className="text-[11px] text-slate-500">
              {metricView === 'volume' && 'Displaying daily count of newly placed vehicle report orders.'}
              {metricView === 'dual' && 'Comparing daily order volume against gross USD revenue trends.'}
              {metricView === 'cumulative' && 'Tracking cumulative order volume progression over the selected period.'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#2563EB] inline-block" />
              <span>Order Volume</span>
            </div>
            {metricView === 'dual' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-[#059669] inline-block" />
                <span>Revenue ($)</span>
              </div>
            )}
          </div>
        </div>

        {/* Recharts SVG Chart Area */}
        <div className="h-72 sm:h-80 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <BarChart2 className="w-8 h-8 text-slate-300" />
              <span>No orders found in this date window.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {metricView === 'cumulative' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state?.activePayload?.[0]?.payload) {
                      setHoveredPoint(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="orderVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulativeCount"
                    name="Cumulative Orders"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#orderVolumeGrad)"
                    activeDot={{ r: 6, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: metricView === 'dual' ? 10 : 10, left: -20, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state?.activePayload?.[0]?.payload) {
                      setHoveredPoint(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  {metricView === 'dual' && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#10B981"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit="$"
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orderCount"
                    name="Order Volume"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive={true}
                  />
                  {metricView === 'dual' && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue ($)"
                      stroke="#059669"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 2.5, fill: '#059669', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Selected / Hovered Data Point Detail Callout */}
        {hoveredPoint && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">
                {hoveredPoint.formattedDate} ({hoveredPoint.dayOfWeek}):
              </span>
              <span className="text-slate-600">
                <strong>{hoveredPoint.orderCount}</strong> {hoveredPoint.orderCount === 1 ? 'order' : 'orders'} placed · <strong>${hoveredPoint.revenue.toFixed(2)}</strong> gross revenue
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Completed: {hoveredPoint.completedCount}</span>
              <span>Processing: {hoveredPoint.processingCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Traffic Distribution by Day of the Week */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pt-1">
        {dayOfWeekStats.map(day => {
          const maxCount = Math.max(...dayOfWeekStats.map(d => d.count), 1);
          const heightPercent = Math.max(10, Math.round((day.count / maxCount) * 100));
          const isPeak = day.count === maxCount && day.count > 0;

          return (
            <div
              key={day.dayName}
              className={`p-3 rounded-xl border transition-all text-center space-y-1.5 ${
                isPeak
                  ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-center justify-between md:justify-center gap-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">{day.dayName}</span>
                {isPeak && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono font-bold">
                    Peak
                  </span>
                )}
              </div>

              {/* Mini vertical volume bar */}
              <div className="h-10 w-full bg-slate-100 rounded-md p-1 flex items-end justify-center">
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    isPeak ? 'bg-blue-600' : 'bg-slate-400'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              <div className="pt-0.5">
                <p className="text-sm font-black font-mono text-slate-900">{day.count}</p>
                <p className="text-[10px] text-slate-400">${day.revenue.toFixed(0)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
