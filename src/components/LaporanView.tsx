import React, { useState, useMemo } from 'react';
import { 
  FileText, Calendar, Filter, Download, CheckCircle, 
  Clock, AlertTriangle, Printer, TrendingUp, Sparkles, HelpCircle 
} from 'lucide-react';
import { Report } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Fix typescript declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface LaporanViewProps {
  reports: Report[];
}

export default function LaporanView({ reports }: LaporanViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Auto detect list of categories
  const categories = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.category))).filter(Boolean);
  }, [reports]);

  // Master Filter Data
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Date filter
      const repDate = r.createdAt.split('T')[0];
      const startMatch = !startDate || repDate >= startDate;
      const endMatch = !endDate || repDate <= endDate;
      
      // Category filter
      const catMatch = !categoryFilter || r.category === categoryFilter;

      // Status filter
      const statusMatch = !statusFilter || r.status === statusFilter;

      return startMatch && endMatch && catMatch && statusMatch;
    });
  }, [reports, startDate, endDate, categoryFilter, statusFilter]);

  // Report Metrics calculations
  const stats = useMemo(() => {
    const total = filteredReports.length;
    const selesai = filteredReports.filter(r => r.status === 'Selesai').length;
    const diproses = filteredReports.filter(r => r.status === 'Diproses').length;
    const pending = filteredReports.filter(r => r.status === 'Menunggu' || r.status === 'Diverifikasi').length;
    const ditolak = filteredReports.filter(r => r.status === 'Ditolak').length;

    // SLA Calculation: average hours to complete
    let totalHours = 0;
    let completedCount = 0;
    
    filteredReports.forEach(r => {
      if (r.status === 'Selesai' && r.timeline) {
        const start = new Date(r.createdAt);
        const selesaiEvent = r.timeline.find(t => t.status === 'Selesai');
        if (selesaiEvent) {
          const end = new Date(selesaiEvent.time);
          const diffMs = end.getTime() - start.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          totalHours += diffHours;
          completedCount++;
        }
      }
    });

    const avgResolutionTime = completedCount > 0 ? (totalHours / completedCount).toFixed(1) : '0';
    const resolutionRate = total > 0 ? ((selesai / total) * 100).toFixed(0) : '0';

    return {
      total,
      selesai,
      diproses,
      pending,
      ditolak,
      avgResolutionTime,
      resolutionRate
    };
  }, [filteredReports]);

  // Export Excel Ledger sheet
  const handleExportExcel = () => {
    const data = filteredReports.map(r => ({
      'No Tiket': r.ticketNumber,
      'Judul Kerusakan': r.title,
      'Kategori': r.category,
      'Lokasi': r.location,
      'Gedung/Sektor': r.building,
      'Kamar/Detail': r.room || '-',
      'Prioritas': r.priority,
      'Status': r.status,
      'Pengaju': r.reporter,
      'Divisi': r.division,
      'Tanggal Pengajuan': new Date(r.createdAt).toLocaleString('id-ID'),
      'PIC Penjawab': r.assignedTo || 'Belum Ditunjuk',
      'Target Selesai': r.estimateFinish || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Kerusakan');
    
    worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }];

    XLSX.writeFile(workbook, `SCB_CARE_Laporan_Aset_Sekolah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export PDF Ledger book
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add title banner
    doc.setFillColor(11, 110, 79); // #0B6E4F Brand Primary
    doc.rect(0, 0, doc.internal.pageSize.width, 32, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SCB-CARE (Sekolah Cendekia BAZNAS)', 14, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Complaint and Asset Repair System - Laporan Rekapitulasi Maintenance', 14, 25);
    
    // Date ranges
    const rangeText = `Periode: ${startDate || 'Semua'} s.d. ${endDate || 'Semua'}  |  Kategori: ${categoryFilter || 'Semua'}`;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(rangeText, 14, 42);

    // Summary KPIs inside PDF
    doc.text(`Total Laporan: ${stats.total}  |  Selesai: ${stats.selesai}  |  Diproses: ${stats.diproses}  |  Pending: ${stats.pending}  |  SLA Rate: ${stats.resolutionRate}%`, 14, 48);

    const headers = [['No Tiket', 'Judul Kerusakan', 'Kategori', 'Lokasi', 'Prioritas', 'Status', 'Pengaju', 'Tanggal', 'PIC/Teknisi']];
    const rows = filteredReports.map(r => [
      r.ticketNumber,
      r.title,
      r.category,
      `${r.location} (${r.room || 'Umum'})`,
      r.priority,
      r.status,
      r.reporter,
      new Date(r.createdAt).toLocaleDateString('id-ID'),
      r.assignedTo || 'Belum Ditunjuk'
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 55,
      theme: 'striped',
      headStyles: { fillColor: [11, 110, 79], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { cellWidth: 50 },
        3: { cellWidth: 40 }
      }
    });

    doc.save(`SCB_CARE_Laporan_Aset_Sekolah_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Title */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Laporan Rekapitulasi & Analisis SLA
        </h1>
        <p className="text-xs text-slate-400">Filter data, analisis kepatuhan target durasi pengerjaan, dan download berkas pertanggungjawaban Tim GA</p>
      </div>

      {/* FILTERS CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 pb-2 border-b">
          <Filter className="w-4 h-4 text-primary" />
          Parameter Filter Data Laporan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Filter Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
            >
              <option value="">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Diverifikasi">Diverifikasi</option>
              <option value="Diproses">Diproses</option>
              <option value="Menunggu Sparepart">Menunggu Sparepart</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIS SUMMARY STATS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Laporan Terpilih</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats.total}</p>
          <span className="text-[9px] text-slate-400 block font-light">Laporan masuk dalam rentang filter</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Perbaikan Selesai</span>
          <p className="text-2xl font-extrabold text-emerald-600">{stats.selesai}</p>
          <span className="text-[9px] text-slate-400 block font-light">Status: Selesai</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Penyelesaian Rata-Rata</span>
          <p className="text-2xl font-extrabold text-blue-600">{stats.avgResolutionTime} <span className="text-xs font-normal">Jam</span></p>
          <span className="text-[9px] text-slate-400 block font-light">Sejak tiket dibuat hingga selesai</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-sm text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Kepatuhan SLA (Rate)</span>
          <p className="text-2xl font-extrabold text-primary">{stats.resolutionRate}%</p>
          <span className="text-[9px] text-slate-400 block font-light">Persentase laporan selesai diatasi</span>
        </div>

      </div>

      {/* EXPORT OPTIONS BOX */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Siap Ekspor Data Pertanggungjawaban?</span>
          </h4>
          <p className="text-xs text-slate-400 font-light">
            Seluruh data di atas ({filteredReports.length} laporan) akan diekspor menjadi ledger pembukuan pemeliharaan secara real-time.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            className="flex-1 md:flex-initial px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Unduh PDF Buku Ledger</span>
          </button>
        </div>
      </div>

    </div>
  );
}
