import React, { useState, useMemo } from 'react';
import { 
  Search, Grid, LayoutGrid, Calendar, MapPin, Wrench, 
  Clock, MessageSquare, AlertTriangle, ArrowRight, Eye, AlertCircle 
} from 'lucide-react';
import { Report } from '../types';

interface ReportsListViewProps {
  reports: Report[];
  onViewTicket: (ticketNumber: string) => void;
  titleText?: string;
  subtitleText?: string;
  defaultStatusFilter?: string; // Optional (e.g. for Riwayat showing only 'Selesai' / 'Ditolak')
}

export default function ReportsListView({ 
  reports, 
  onViewTicket,
  titleText = "Daftar Laporan Kerusakan",
  subtitleText = "Daftar seluruh laporan kerusakan sarana prasarana sekolah yang diajukan",
  defaultStatusFilter = ""
}: ReportsListViewProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState('');

  // Status mapping progress
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

  // Filtered list
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Search text match
      const textMatch = !searchQuery.trim() || 
        r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter match
      const statusMatch = !statusFilter || r.status === statusFilter;

      // Priority filter match
      const priorityMatch = !priorityFilter || r.priority === priorityFilter;

      return textMatch && statusMatch && priorityMatch;
    });
  }, [reports, searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header section */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            {titleText}
          </h1>
          <p className="text-xs text-slate-400">{subtitleText}</p>
        </div>

        {/* Search Input on header */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari laporan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none"
          />
          <div className="absolute left-3.5 top-2.5 text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Filters strip */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status quick select capsules */}
        {[
          { label: 'Semua Laporan', value: '' },
          { label: 'Menunggu', value: 'Menunggu' },
          { label: 'Diverifikasi', value: 'Diverifikasi' },
          { label: 'Diproses', value: 'Diproses' },
          { label: 'Menunggu Sparepart', value: 'Menunggu Sparepart' },
          { label: 'Selesai', value: 'Selesai' },
          { label: 'Ditolak', value: 'Ditolak' }
        ].map(btn => (
          <button
            key={btn.label}
            onClick={() => setStatusFilter(btn.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${statusFilter === btn.value ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50'}`}
          >
            {btn.label}
          </button>
        ))}

        {/* Priority Filter select */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="ml-auto px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs rounded-full text-slate-600 dark:text-slate-300 font-semibold focus:outline-none"
        >
          <option value="">Semua Prioritas</option>
          <option value="Rendah">Rendah</option>
          <option value="Sedang">Sedang</option>
          <option value="Tinggi">Tinggi</option>
          <option value="Darurat">Darurat</option>
        </select>
      </div>

      {/* Grid of cards */}
      {filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-16 text-center text-slate-400">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <span className="font-semibold block text-slate-700 dark:text-slate-200">Tidak ada laporan yang cocok</span>
          <p className="text-[10px] text-slate-400 mt-1">Harap sesuaikan filter status atau kata kunci pencarian Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(rep => {
            const isUrgent = rep.priority === 'Darurat';
            const progress = getStatusProgress(rep.status);

            const priorityBadge = {
              'Rendah': 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 border-blue-100',
              'Sedang': 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 border-yellow-100',
              'Tinggi': 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 border-orange-100',
              'Darurat': 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 border-rose-100 font-extrabold animate-pulse'
            };

            const statusColors = {
              'Menunggu': 'bg-yellow-500',
              'Diverifikasi': 'bg-purple-500',
              'Diproses': 'bg-blue-500',
              'Menunggu Sparepart': 'bg-amber-500',
              'Selesai': 'bg-emerald-500',
              'Ditolak': 'bg-red-500',
            };

            return (
              <div 
                key={rep.ticketNumber}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition material-card flex flex-col justify-between"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {rep.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${priorityBadge[rep.priority] || 'bg-slate-100 text-slate-600'}`}>
                      {rep.priority}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                    {rep.title}
                  </h3>
                  
                  <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-2 font-light">
                    {rep.description}
                  </p>
                </div>

                {/* Body Details */}
                <div className="space-y-3 pt-4 my-4 border-t border-slate-50 dark:border-slate-700/50">
                  {/* Location badge */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{rep.location} ({rep.room || 'Umum'})</span>
                  </div>

                  {/* Category & Asset */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{rep.category} • {rep.assetName}</span>
                  </div>

                  {/* Photo thumbnail count indicator */}
                  {rep.beforePhotos && rep.beforePhotos.length > 0 && (
                    <div className="flex gap-1.5 pt-1">
                      {rep.beforePhotos.slice(0, 3).map((img, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700">
                          <img src={img} alt="before thumb" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {rep.beforePhotos.length > 3 && (
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-lg flex items-center justify-center font-bold text-xs">
                          +{rep.beforePhotos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress info */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[rep.status] || 'bg-slate-400'}`}></span>
                        {rep.status}
                      </span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${rep.status === 'Selesai' ? 'bg-emerald-500' : rep.status === 'Ditolak' ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{new Date(rep.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {rep.comments && rep.comments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                        <span>{rep.comments.length}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => onViewTicket(rep.ticketNumber)}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-bold group/btn"
                    >
                      <span>Detail</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
