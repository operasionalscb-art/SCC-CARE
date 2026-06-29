import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, CheckCircle2, Clock, 
  HelpCircle, ShieldAlert, ArrowRight, MapPin, 
  Wrench, Activity, Sparkles, Building2, UserCheck
} from 'lucide-react';
import { Report, Asset, Category, Location } from '../types';

interface DashboardViewProps {
  reports: Report[];
  assets: Asset[];
  categories: Category[];
  locations: Location[];
  onViewTicket: (ticketNumber: string) => void;
  darkMode: boolean;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

export default function DashboardView({ reports, assets, categories, locations, onViewTicket, darkMode, isGuest, onLoginClick }: DashboardViewProps) {
  // Stat counters
  const stats = useMemo(() => {
    let total = reports.length;
    let waiting = 0;
    let verified = 0;
    let inProgress = 0;
    let waitingSparepart = 0;
    let finished = 0;
    let rejected = 0;
    let urgent = 0;

    reports.forEach(r => {
      if (r.status === 'Menunggu') waiting++;
      else if (r.status === 'Diverifikasi') verified++;
      else if (r.status === 'Diproses') inProgress++;
      else if (r.status === 'Menunggu Sparepart') waitingSparepart++;
      else if (r.status === 'Selesai') finished++;
      else if (r.status === 'Ditolak') rejected++;

      if (r.priority === 'Darurat') urgent++;
    });

    // Average resolution time (only for Selesai)
    let totalResolutionHours = 0;
    let finishedWithSlaCount = 0;
    let metSlaCount = 0;

    reports.forEach(r => {
      if (r.status === 'Selesai') {
        const created = new Date(r.createdAt).getTime();
        const updated = new Date(r.updatedAt).getTime();
        const diffHours = (updated - created) / (1000 * 60 * 60);
        totalResolutionHours += diffHours;
        finishedWithSlaCount++;

        // SLA validation
        let maxHours = 168; // Rendah
        if (r.priority === 'Darurat') maxHours = 2;
        else if (r.priority === 'Tinggi') maxHours = 24;
        else if (r.priority === 'Sedang') maxHours = 72;

        if (diffHours <= maxHours) {
          metSlaCount++;
        }
      }
    });

    const avgResolutionTime = finishedWithSlaCount > 0 
      ? (totalResolutionHours / finishedWithSlaCount).toFixed(1) 
      : '0';

    const slaPercentage = finishedWithSlaCount > 0
      ? Math.round((metSlaCount / finishedWithSlaCount) * 100)
      : 100;

    return {
      total,
      waiting: waiting + verified, // Combine waiting & verified as 'Menunggu' for simple overview
      inProgress: inProgress + waitingSparepart, // Combine in progress & waiting spareparts as 'Diproses'
      finished,
      rejected,
      urgent,
      avgResolutionTime,
      slaPercentage
    };
  }, [reports]);

  // Chart 1: Reports per Month (Jan - Dec 2026)
  const monthlyChartData = useMemo(() => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const counts = Array(12).fill(0);
    
    reports.forEach(r => {
      const d = new Date(r.createdAt);
      if (d.getFullYear() === 2026) {
        counts[d.getMonth()]++;
      }
    });

    return months.map((m, idx) => ({
      name: m.substring(0, 3),
      Laporan: counts[idx]
    })).slice(0, 7); // Show up to July for realistic display in 2026
  }, [reports]);

  // Chart 2: Reports by Category
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => {
      map[r.category] = (map[r.category] || 0) + 1;
    });

    return Object.entries(map).map(([name, val]) => ({
      name,
      Jumlah: val
    })).sort((a, b) => b.Jumlah - a.Jumlah).slice(0, 6);
  }, [reports]);

  // Chart 3: Reports by Location (for Pie Chart)
  const locationChartData = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => {
      map[r.location] = (map[r.location] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [reports]);

  // Chart 4: Reports by Division
  const divisionChartData = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => {
      map[r.division] = (map[r.division] || 0) + 1;
    });

    return Object.entries(map).map(([name, Laporan]) => ({
      name,
      Laporan
    })).sort((a, b) => b.Laporan - a.Laporan);
  }, [reports]);

  // Top 10 most broken assets
  const topAssets = useMemo(() => {
    const map: Record<string, { code: string; name: string; count: number; category: string }> = {};
    reports.forEach(r => {
      if (r.assetCode) {
        if (!map[r.assetCode]) {
          map[r.assetCode] = { code: r.assetCode, name: r.assetName || "Aset Tanpa Nama", count: 0, category: r.category };
        }
        map[r.assetCode].count++;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [reports]);

  // Top 10 locations with most breakdowns
  const topLocations = useMemo(() => {
    const map: Record<string, { name: string; count: number; building: string }> = {};
    reports.forEach(r => {
      if (r.location) {
        if (!map[r.location]) {
          map[r.location] = { name: r.location, count: 0, building: r.building || "Sekolah" };
        }
        map[r.location].count++;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [reports]);

  // Colors for charts
  const COLORS = ['#0B6E4F', '#FFC107', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6'];

  // Latest reports feed
  const latestReports = useMemo(() => {
    return reports.slice(0, 5);
  }, [reports]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Guest Mode Warning Banner */}
      {isGuest && (
        <div id="guest-alert-banner" className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5.5 h-5.5" />
            </div>
            <div className="space-y-1 text-left">
              <h3 className="font-extrabold text-xs text-amber-800 dark:text-amber-300">
                Mode Pengunjung Anonim (Belum Masuk)
              </h3>
              <p className="text-[11px] text-amber-700/85 dark:text-amber-400/80 leading-relaxed font-light">
                Anda hanya dapat melihat dashboard analisis ini. Untuk membuat pengaduan aduan kerusakan sarana prasarana sekolah, silakan masuk atau registrasi akun pegawai terlebih dahulu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLoginClick}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition shrink-0 flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Masuk / Registrasi Sekarang</span>
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-emerald-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-600 rounded-full opacity-20 blur-2xl"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-700/50 rounded-full text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span>Sistem Pemeliharaan & Perbaikan Real-Time</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Dashboard SCB-CARE</h1>
          <p className="text-emerald-100 max-w-xl text-sm md:text-base font-light">
            Sistem pengaduan kerusakan sarana prasarana Sekolah Cendekia BAZNAS. Pantau progres perbaikan aset sekolah secara instan.
          </p>
        </div>
      </div>

      {/* SLA & Time stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Pencapaian target SLA</span>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Circular indicator SVG */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-700"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    strokeDasharray={`${stats.slaPercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="rounded"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-lg font-bold text-slate-800 dark:text-slate-100">{stats.slaPercentage}%</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Service Level Agreement (SLA)</h4>
                <p className="text-slate-400 text-xs font-light max-w-xs leading-relaxed">
                  Persentase perbaikan diselesaikan tepat waktu sesuai prioritas (Darurat: 2 jam, Tinggi: 1 hari, Sedang: 3 hari, Rendah: 7 hari).
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 flex justify-between text-xs text-slate-500">
            <span>Standar GA Cendekia</span>
            <span className="font-semibold text-primary">Target Global: &gt;90%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Durasi Pemeliharaan</span>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-primary">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {stats.avgResolutionTime} <span className="text-sm font-normal text-slate-400">jam</span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">Rata-rata Waktu Penyelesaian</h4>
                <p className="text-slate-400 text-xs font-light leading-relaxed mt-1">
                  Dihitung sejak tiket dibuat hingga teknisi merubah status menjadi "Selesai".
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 flex justify-between text-xs text-slate-500">
            <span>Kinerja Kecepatan Perbaikan</span>
            <span className="font-semibold text-amber-500">Sangat Responsif</span>
          </div>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">Total Tiket</span>
            <span className="p-1 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-400 block mt-1">Laporan masuk</span>
          </div>
        </div>

        {/* Menunggu */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">Menunggu</span>
            <span className="p-1 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-yellow-600">{stats.waiting}</span>
            <span className="text-xs text-slate-400 block mt-1">Butuh verifikasi</span>
          </div>
        </div>

        {/* Diproses */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">Diproses</span>
            <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-blue-600">{stats.inProgress}</span>
            <span className="text-xs text-slate-400 block mt-1">Sedang diperbaiki</span>
          </div>
        </div>

        {/* Selesai */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">Selesai</span>
            <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-600">{stats.finished}</span>
            <span className="text-xs text-slate-400 block mt-1">Terselesaikan</span>
          </div>
        </div>

        {/* Ditolak */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500">Ditolak</span>
            <span className="p-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600">
              <HelpCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-red-600">{stats.rejected}</span>
            <span className="text-xs text-slate-400 block mt-1">Tidak disetujui</span>
          </div>
        </div>

        {/* Darurat */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 font-extrabold text-rose-600">Darurat 🔥</span>
            <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-rose-600">{stats.urgent}</span>
            <span className="text-xs text-slate-400 block mt-1">SLA &lt; 2 jam</span>
          </div>
        </div>
      </div>

      {/* Graphical Dashboard Panel (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports trend per month */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Tren Laporan Per Bulan</h3>
              <p className="text-xs text-slate-400">Statistik frekuensi kerusakan aset Tahun 2026</p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="Laporan" stroke="#0B6E4F" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports by Category */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Kerusakan Berdasarkan Kategori</h3>
              <p className="text-xs text-slate-400">Kategori sarpras paling sering dilaporkan</p>
            </div>
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderRadius: 12, border: 'none' }} />
                <Bar dataKey="Jumlah" fill="#0B6E4F" radius={[8, 8, 0, 0]} maxBarSize={35}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Location (Pie Chart) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mb-1">Distribusi Lokasi Kerusakan</h3>
            <p className="text-xs text-slate-400 mb-4">Area atau gedung yang paling sering mengalami masalah</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {locationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {locationChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[130px]">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{entry.value} Laporan</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reports by Division */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mb-1">Pelaporan Berdasarkan Divisi</h3>
            <p className="text-xs text-slate-400 mb-4">Grafik asal divisi pelapor kerusakan</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={divisionChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? "#334155" : "#f1f5f9"} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="Laporan" fill="#FFC107" radius={[0, 6, 6, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 10 lists & Recent Activites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 broken assets */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Top 10 Aset Sering Rusak</h3>
          </div>
          {topAssets.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Belum ada riwayat kerusakan aset.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-96 overflow-y-auto pr-1">
              {topAssets.map((item, idx) => (
                <div key={item.code} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-700 px-1 py-0.5 rounded uppercase">
                      {item.code} • {item.category}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 font-extrabold">
                      {item.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 10 locations with most breakdowns */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-red-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Top 10 Lokasi Rawan Kerusakan</h3>
          </div>
          {topLocations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Belum ada data kerusakan lokasi.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-96 overflow-y-auto pr-1">
              {topLocations.map((item, idx) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 shrink-0" /> {item.building}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-extrabold">
                      {item.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity list */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Laporan Terbaru</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {latestReports.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">Belum ada laporan kerusakan.</div>
            ) : (
              latestReports.map(rep => {
                const isUrgent = rep.priority === 'Darurat';
                const statusColors = {
                  'Menunggu': 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40',
                  'Diverifikasi': 'bg-purple-50 text-purple-600 dark:bg-purple-950/40',
                  'Diproses': 'bg-blue-50 text-blue-600 dark:bg-blue-950/40',
                  'Menunggu Sparepart': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40',
                  'Selesai': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',
                  'Ditolak': 'bg-red-50 text-red-600 dark:bg-red-950/40',
                };
                return (
                  <div 
                    key={rep.ticketNumber} 
                    onClick={() => onViewTicket(rep.ticketNumber)}
                    className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
                        {rep.ticketNumber}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${statusColors[rep.status] || 'bg-slate-100 text-slate-600'}`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-1 truncate group-hover:text-primary transition">
                      {rep.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span className="truncate max-w-[120px]">{rep.reporter} ({rep.division})</span>
                      <span className="shrink-0 font-mono">
                        {new Date(rep.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
