import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ArrowUpDown, ChevronDown, Download, 
  FileText, Calendar, CheckCircle2, AlertTriangle, Clock, 
  UserCheck, MapPin, Eye, Table, RefreshCw, X, SlidersHorizontal
} from 'lucide-react';
import { Report, UserRole, UserProfile } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface MonitoringViewProps {
  reports: Report[];
  userRole: UserRole;
  users: UserProfile[];
  onViewTicket: (ticketNumber: string) => void;
  onUpdateStatus?: (reportId: string, status: any, pic: string, note: string) => void;
}

export default function MonitoringView({ 
  reports, 
  userRole, 
  users,
  onViewTicket,
  onUpdateStatus 
}: MonitoringViewProps) {
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPic, setFilterPic] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Sorting & Pagination
  const [sortField, setSortField] = useState<'ticketNumber' | 'createdAt' | 'priority' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Show advanced filters panel toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Status mapping to progress percentage
  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'Menunggu': return 15;
      case 'Diverifikasi': return 35;
      case 'Diproses': return 65;
      case 'Menunggu Sparepart': return 80;
      case 'Selesai': return 100;
      case 'Ditolak': return 0;
      default: return 10;
    }
  };

  // Unique filters list builders (dynamic from active reports list)
  const uniqueLocations = useMemo(() => Array.from(new Set(reports.map(r => r.location).filter(Boolean))), [reports]);
  const uniqueCategories = useMemo(() => Array.from(new Set(reports.map(r => r.category).filter(Boolean))), [reports]);
  const uniqueDivisions = useMemo(() => Array.from(new Set(reports.map(r => r.division).filter(Boolean))), [reports]);
  const uniquePics = useMemo(() => Array.from(new Set(reports.map(r => r.assignedTo).filter(Boolean))), [reports]);

  // Handle Sort Change
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Master Filter-and-Sort Logic
  const processedReports = useMemo(() => {
    let result = [...reports];

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.ticketNumber.toLowerCase().includes(q) ||
        r.reporter.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.assetCode && r.assetCode.toLowerCase().includes(q)) ||
        (r.assetName && r.assetName.toLowerCase().includes(q))
      );
    }

    // Facet filters
    if (filterPriority) result = result.filter(r => r.priority === filterPriority);
    if (filterStatus) result = result.filter(r => r.status === filterStatus);
    if (filterCategory) result = result.filter(r => r.category === filterCategory);
    if (filterDivision) result = result.filter(r => r.division === filterDivision);
    if (filterLocation) result = result.filter(r => r.location === filterLocation);
    if (filterPic) result = result.filter(r => r.assignedTo === filterPic);

    // Date range filters
    if (filterStartDate) {
      const start = new Date(filterStartDate).getTime();
      result = result.filter(r => new Date(r.createdAt).getTime() >= start);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      result = result.filter(r => new Date(r.createdAt).getTime() <= end.getTime());
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'ticketNumber') {
        comparison = a.ticketNumber.localeCompare(b.ticketNumber);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'priority') {
        const priorityOrder = { 'Rendah': 1, 'Sedang': 2, 'Tinggi': 3, 'Darurat': 4 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    reports, searchQuery, filterPriority, filterStatus, filterCategory, 
    filterDivision, filterLocation, filterPic, filterStartDate, filterEndDate, 
    sortField, sortOrder
  ]);

  // Pagination bounds
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedReports.slice(startIndex, startIndex + itemsPerPage);
  }, [processedReports, currentPage]);

  const totalPages = Math.ceil(processedReports.length / itemsPerPage) || 1;

  // Reset Filters handler
  const resetFilters = () => {
    setSearchQuery('');
    setFilterPriority('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterDivision('');
    setFilterLocation('');
    setFilterPic('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    const dataToExport = processedReports.map(r => ({
      'Nomor Tiket': r.ticketNumber,
      'Tanggal Pengaduan': new Date(r.createdAt).toLocaleDateString('id-ID'),
      'Pelapor': r.reporter,
      'Email': r.email,
      'Divisi': r.division,
      'Lokasi': r.location,
      'Gedung': r.building,
      'Lantai': r.floor,
      'Ruangan': r.room,
      'Kategori': r.category,
      'Kode Aset': r.assetCode,
      'Nama Aset': r.assetName,
      'Judul Kerusakan': r.title,
      'Deskripsi Kerusakan': r.description,
      'Prioritas': r.priority,
      'Status': r.status,
      'PIC (Teknisi)': r.assignedTo || '-',
      'SLA Terpenuhi': r.slaMet !== undefined ? (r.slaMet ? 'YA' : 'TIDAK') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Kerusakan');
    
    // Auto fit column width
    const max_val = dataToExport.reduce((acc, row) => {
      Object.keys(row).forEach((key) => {
        const val = String(row[key as keyof typeof row] || '');
        acc[key] = Math.max(acc[key] || 0, val.length, key.length);
      });
      return acc;
    }, {} as Record<string, number>);
    worksheet['!cols'] = Object.keys(max_val).map(key => ({ wch: max_val[key] + 3 }));

    XLSX.writeFile(workbook, `SCB_CARE_Monitoring_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // EXPORT TO PDF
  const handleExportPdf = () => {
    const doc = new jsPDF('landscape');
    
    // Title & Header setup
    doc.setFontSize(18);
    doc.setTextColor(11, 110, 79); // primary green
    doc.text('LAPORAN MONITORING SCB-CARE', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Sekolah Cendekia BAZNAS (Complaint and Asset Repair System)`, 14, 26);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} | Total: ${processedReports.length} Laporan`, 14, 31);
    
    // Draw thick accent line
    doc.setDrawColor(11, 110, 79);
    doc.setLineWidth(1);
    doc.line(14, 35, 282, 35);

    // Construct table rows
    const columns = [
      { title: "No Tiket", dataKey: "ticket" },
      { title: "Tanggal", dataKey: "date" },
      { title: "Pelapor (Divisi)", dataKey: "reporter" },
      { title: "Lokasi (Ruang)", dataKey: "location" },
      { title: "Judul Kerusakan", dataKey: "title" },
      { title: "Kategori", dataKey: "category" },
      { title: "Prioritas", dataKey: "priority" },
      { title: "Status", dataKey: "status" },
      { title: "PIC / Teknisi", dataKey: "pic" }
    ];

    const rows = processedReports.map(r => ({
      ticket: r.ticketNumber,
      date: new Date(r.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      reporter: `${r.reporter}\n(${r.division})`,
      location: `${r.location}\n(${r.room || 'Umum'})`,
      title: r.title,
      category: r.category,
      priority: r.priority,
      status: r.status,
      pic: r.assignedTo || '-'
    }));

    (doc as any).autoTable({
      columns,
      body: rows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [11, 110, 79], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        ticket: { fontStyle: 'bold', width: 28 },
        date: { width: 18 },
        reporter: { width: 32 },
        location: { width: 35 },
        title: { width: 45 },
        category: { width: 20 },
        priority: { width: 16 },
        status: { width: 22 },
        pic: { width: 32 }
      },
      didDrawPage: (data: any) => {
        // Footer signature
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Halaman ${data.pageNumber} - SCB-CARE BAZNAS`, 14, 200);
      }
    });

    doc.save(`SCB_CARE_Monitoring_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* Title with Export and Reset Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Table className="w-5 h-5 text-primary" />
            Monitoring Tiket Laporan
          </h1>
          <p className="text-xs text-slate-400">Dashboard tabel monitoring dan analisis status perbaikan seluruh aset</p>
        </div>
        
        {/* Quick Export Panel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={resetFilters}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
        {/* Row 1: Search & Basic filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Cari No Tiket, Nama Pelapor, Judul Kerusakan..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-xl focus:outline-none text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Semua Prioritas</option>
              <option value="Rendah">Rendah</option>
              <option value="Sedang">Sedang</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Darurat">Darurat</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-xl focus:outline-none text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20"
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

        {/* Toggle Advanced Filters */}
        <div className="flex justify-between items-center pt-1">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-xs font-bold text-primary hover:text-primary-hover transition flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvancedFilters ? "Sembunyikan Filter Lanjutan" : "Tampilkan Filter Lanjutan"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <span className="text-[10px] text-slate-400 font-mono">
            Ditemukan: <span className="font-bold text-slate-700 dark:text-slate-200">{processedReports.length}</span> laporan
          </span>
        </div>

        {/* Row 2: Advanced filters (Collabsible) */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 animate-fade-in">
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none text-slate-600 dark:text-slate-300"
              >
                <option value="">Semua Kategori</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Division */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Divisi Pelapor</label>
              <select
                value={filterDivision}
                onChange={(e) => { setFilterDivision(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none text-slate-600 dark:text-slate-300"
              >
                <option value="">Semua Divisi</option>
                {uniqueDivisions.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi / Gedung</label>
              <select
                value={filterLocation}
                onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none text-slate-600 dark:text-slate-300"
              >
                <option value="">Semua Lokasi</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* PIC */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PIC / Teknisi</label>
              <select
                value={filterPic}
                onChange={(e) => { setFilterPic(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none text-slate-600 dark:text-slate-300"
              >
                <option value="">Semua Teknisi</option>
                {uniquePics.map(pic => (
                  <option key={pic} value={pic}>{pic}</option>
                ))}
              </select>
            </div>

            {/* Date range filters */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Mulai</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl text-slate-600 dark:text-slate-300"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Selesai</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl text-slate-600 dark:text-slate-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* DENSE TABULAR MONITORING TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th 
                  onClick={() => handleSort('ticketNumber')}
                  className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none transition"
                >
                  <div className="flex items-center gap-1">
                    <span>No Tiket</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('createdAt')}
                  className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="p-4">Pelapor (Divisi)</th>
                <th className="p-4">Lokasi / Ruang</th>
                <th className="p-4">Kategori</th>
                <th 
                  onClick={() => handleSort('priority')}
                  className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Prioritas</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="p-4 text-center">Progress</th>
                <th className="p-4">PIC / Teknisi</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <span className="font-medium">Laporan tidak ditemukan</span>
                    <p className="text-[10px] text-slate-400 mt-1">Harap sesuaikan kata pencarian atau setelan filter Anda</p>
                  </td>
                </tr>
              ) : (
                paginatedReports.map(rep => {
                  const progressVal = getStatusProgress(rep.status);
                  
                  // Color codes
                  const priorityColors = {
                    'Rendah': 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30',
                    'Sedang': 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/30',
                    'Tinggi': 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30',
                    'Darurat': 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 font-extrabold animate-pulse'
                  };

                  const statusColors = {
                    'Menunggu': 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 border-yellow-100',
                    'Diverifikasi': 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 border-purple-100',
                    'Diproses': 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 border-blue-100',
                    'Menunggu Sparepart': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 border-amber-100',
                    'Selesai': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-100',
                    'Ditolak': 'bg-red-50 text-red-600 dark:bg-red-950/40 border-red-100',
                  };

                  const progressColors = (status: string) => {
                    if (status === 'Selesai') return 'bg-emerald-500';
                    if (status === 'Ditolak') return 'bg-red-500';
                    if (status === 'Menunggu Sparepart') return 'bg-amber-500';
                    if (status === 'Diproses') return 'bg-blue-500';
                    return 'bg-yellow-500';
                  };

                  return (
                    <tr key={rep.ticketNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      {/* Ticket Number */}
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {rep.ticketNumber}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {new Date(rep.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </td>

                      {/* Reporter */}
                      <td className="p-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block truncate max-w-[120px]">
                          {rep.reporter}
                        </span>
                        <span className="text-[10px] text-slate-400 font-light block">{rep.division}</span>
                      </td>

                      {/* Location */}
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold truncate">{rep.location}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-light block ml-4 truncate max-w-[135px]">
                          {rep.room || 'Umum'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {rep.category}
                      </td>

                      {/* Priority */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityColors[rep.priority] || 'bg-slate-100 text-slate-600'}`}>
                          {rep.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[rep.status] || 'bg-slate-100 text-slate-600'}`}>
                          {rep.status}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td className="p-4">
                        <div className="w-16 mx-auto">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                            <span>{progressVal}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${progressColors(rep.status)}`}
                              style={{ width: `${progressVal}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* PIC / Teknisi */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {rep.assignedTo ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate max-w-[100px]">{rep.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-light text-[11px]">Belum Ada PIC</span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onViewTicket(rep.ticketNumber)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-primary hover:text-primary-hover transition"
                          title="Lihat Detail Tiket"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-mono">
            Halaman <span className="font-bold text-slate-700 dark:text-slate-200">{currentPage}</span> dari <span className="font-bold text-slate-700 dark:text-slate-200">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 font-bold transition select-none"
            >
              Kembali
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 font-bold transition select-none"
            >
              Lanjut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
