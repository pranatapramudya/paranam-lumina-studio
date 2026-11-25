"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  ChevronDown,
  Clock,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartData = { name: string; amount: number }[];

type RecentBooking = {
  id: string;
  bookingCode: string;
  customerName: string;
  className: string;
  amount: number;
  paymentStatus: string;
  attendanceStatus: string;
  timestamp: string;
};

type DashboardProps = {
  totalBookings: number;
  pendingPayments: number;
  totalSchedules: number;
  attendedCount: number;
  revenue: number;
  expenses: number;
  chartData: ChartData;
  recentBookings: RecentBooking[];
};

export default function DashboardClient({
  totalBookings,
  pendingPayments,
  totalSchedules,
  attendedCount,
  revenue,
  expenses,
  chartData,
  recentBookings,
}: DashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }),
  );
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [recentSearch, setRecentSearch] = useState("");

  useEffect(() => {
    // Auto-refresh setiap 10 menit secara silent (tanpa kedip UI)
    const interval = setInterval(
      () => {
        startTransition(() => {
          router.refresh();
        });
        setLastUpdated(
          new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
          }),
        );
      },
      10 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [router]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
    });
    setLastUpdated(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
    );
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const stats = [
    {
      label: "Total Booking Masuk",
      value: totalBookings.toString(),
      subtext:
        pendingPayments > 0
          ? `${pendingPayments} Menunggu Bayar`
          : "Semua Lunas",
      icon: Users,
      gradient: "from-[#3B6251] to-[#254336]",
    },
    {
      label: "Total Pendapatan Lunas",
      value: `Rp ${revenue.toLocaleString("id-ID")}`,
      subtext: `Keluar Rp ${expenses.toLocaleString("id-ID")} • Bersih Rp ${(revenue - expenses).toLocaleString("id-ID")}`,
      icon: TrendingUp,
      gradient: "from-emerald-600 to-teal-600",
    },
    {
      label: "Kelas Aktif",
      value: `${totalSchedules} Kelas`,
      subtext: "Tampil di Jadwal Publik",
      icon: CalendarDays,
      gradient: "from-amber-600 to-orange-500",
    },
    {
      label: "Check-in Studio",
      value: `${attendedCount} Hadir`,
      subtext: "Via Scan QR / Admin",
      icon: CheckCircle2,
      gradient: "from-slate-700 to-slate-900",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#162620] tracking-tight">
            Dashboard Studio
          </h1>
          <p className="text-[#5D6E66] text-sm mt-1">
            Ringkasan booking konsumen & operasional Paranam Lumina.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#E9EFEA] px-3 py-1.5 rounded-full border border-[#C8E0D5]">
            <Clock className="w-3.5 h-3.5 text-[#4D7762]" />
            <span className="text-xs font-bold text-[#2A5040]">
              Auto-sync 10m · {lastUpdated} WIB
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            className="p-2 bg-white hover:bg-[#E9EFEA] rounded-full transition-colors text-[#5D6E66] border border-[#E6E2D8]"
            title="Refresh Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4D7762] hover:bg-[#3B6251] text-white text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh Laporan
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
              />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E6E2D8] rounded-2xl shadow-xl z-20 overflow-hidden">
                {[
                  { label: "📅 Harian (hari ini)", period: "daily" },
                  { label: "📆 Mingguan (pekan ini)", period: "weekly" },
                  { label: "🗓 Bulanan (bulan ini)", period: "monthly" },
                  { label: "📊 Custom (rentang tanggal)", period: null },
                ].map((opt) => (
                  <a
                    key={opt.period ?? "custom"}
                    href={
                      opt.period
                        ? `/api/export?period=${opt.period}`
                        : `/api/export?from=${searchParams.get("from") || ""}&to=${searchParams.get("to") || ""}`
                    }
                    onClick={() => setShowExportMenu(false)}
                    download
                    className="block px-4 py-3 text-xs font-semibold text-[#162620] hover:bg-[#F6F4EF] transition-colors border-t border-[#F0EDE5] first:border-none"
                  >
                    {opt.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter + Stats */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-end">
          <DateRangePicker />
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-[#E6E2D8] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#5D6E66] bg-[#F6F4EF] px-2.5 py-1 rounded-full">
                    Real-time
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-[#162620] tracking-tight">
                  {stat.value}
                </p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-xs font-medium text-[#5D6E66]">
                    {stat.label}
                  </p>
                  <span className="text-[10px] font-semibold text-[#3B6251] bg-[#E9EFEA] px-2 py-0.5 rounded">
                    {stat.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* Chart & Recent Bookings */}
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl p-6 border border-[#E6E2D8] shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#162620]">
              Grafik Pendapatan Kelas
            </h3>
            <p className="text-xs text-[#5D6E66] mt-0.5">
              Akumulasi pembayaran lunas
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B6251" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B6251" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#5D6E66" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#5D6E66" }}
                  tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}k`}
                  width={75}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `Rp ${(Number(value) || 0).toLocaleString("id-ID")}`,
                    "Pendapatan",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B6251"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-[#E6E2D8] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#162620]">
              Booking Terbaru
            </h3>
            <Link
              href="/2026/personal-trainer"
              className="text-xs font-bold text-[#4D7762] hover:underline"
            >
              Kelola →
            </Link>
          </div>
          {/* Search recent bookings */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9BA8A0]" />
            <input
              type="text"
              placeholder="Cari nama atau kode..."
              value={recentSearch}
              onChange={(e) => setRecentSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F6F4EF] border border-[#E6E2D8] rounded-xl text-xs font-semibold text-[#162620] outline-none focus:ring-2 focus:ring-[#4D7762]"
            />
          </div>
          <div className="space-y-3">
            {recentBookings
              .filter((item) => {
                const q = recentSearch.toLowerCase();
                return (
                  !q ||
                  item.customerName.toLowerCase().includes(q) ||
                  item.bookingCode.toLowerCase().includes(q) ||
                  item.className.toLowerCase().includes(q)
                );
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-[#F6F4EF] last:border-none"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#162620] truncate">
                      {item.customerName}
                    </p>
                    <p className="text-[11px] text-[#5D6E66] truncate">
                      {item.className} •{" "}
                      <span className="font-mono">{item.bookingCode}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-[#162620]">
                      Rp {item.amount.toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.paymentStatus === "PAID"
                          ? "bg-[#E9EFEA] text-[#254336]"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.paymentStatus === "PAID" ? "LUNAS" : "PENDING"}
                    </span>
                  </div>
                </div>
              ))}
            {recentBookings.length === 0 && (
              <p className="text-xs text-[#5D6E66] text-center py-6">
                Belum ada booking masuk.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
