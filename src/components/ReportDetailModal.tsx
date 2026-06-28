import React, { useState } from 'react';
import { 
  X, Calendar, User, Mail, ShieldAlert, MapPin, 
  Wrench, Clock, MessageSquare, Send, CheckCircle, 
  Trash2, AlertTriangle, AlertCircle, Sparkles, Building, 
  FileText, Upload, Image as ImageIcon, Camera
} from 'lucide-react';
import { Report, UserRole, UserProfile, Comment, TimelineEvent } from '../types';

interface ReportDetailModalProps {
  report: Report;
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateReport: (reportId: string, updates: Partial<Report>, updatedBy: string) => Promise<void>;
  onDeleteReport?: (reportId: string) => Promise<void>;
}

export default function ReportDetailModal({ 
  report, 
  currentUser, 
  onClose, 
  onUpdateReport,
  onDeleteReport
}: ReportDetailModalProps) {
  
  const isGAOrAdmin = currentUser.role === 'GA' || currentUser.role === 'Administrator';
  
  // Administrative Form States
  const [status, setStatus] = useState(report.status);
  const [assignedTo, setAssignedTo] = useState(report.assignedTo || '');
  const [estimateFinish, setEstimateFinish] = useState(report.estimateFinish || '');
  const [techNote, setTechNote] = useState('');
  const [afterPhotos, setAfterPhotos] = useState<string[]>(report.afterPhotos || []);
  
  // Comments feed State
  const [commentText, setCommentText] = useState('');
  
  // Loading & UI States
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status mapping to progress percentage
  const getStatusProgress = (stat: string) => {
    switch (stat) {
      case 'Menunggu': return 15;
      case 'Diverifikasi': return 35;
      case 'Diproses': return 65;
      case 'Menunggu Sparepart': return 80;
      case 'Selesai': return 100;
      case 'Ditolak': return 0;
      default: return 10;
    }
  };

  // Handle uploading "After Repair" photos
  const handleAfterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setAfterPhotos(prev => [...prev, compressed]);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAfterPhoto = (idx: number) => {
    setAfterPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Comments
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      commentText: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...(report.comments || []), newComment];
    
    // Auto insert timeline trace if needed
    await onUpdateReport(report.id!, { comments: updatedComments }, currentUser.name);
    setCommentText('');
  };

  // Save General Affair Updates
  const handleSaveAdminChanges = async () => {
    setIsSaving(true);
    try {
      const isStatusChanged = status !== report.status;
      const isPicChanged = assignedTo !== report.assignedTo;
      
      const newTimeline: TimelineEvent[] = [...(report.timeline || [])];
      
      if (isStatusChanged) {
        newTimeline.push({
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toISOString(),
          status: status,
          note: techNote.trim() || `Status laporan dirubah menjadi: ${status}`,
          updatedBy: currentUser.name
        });
      } else if (isPicChanged && assignedTo) {
        newTimeline.push({
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toISOString(),
          status: report.status,
          note: `Laporan ditugaskan ke PIC: ${assignedTo}`,
          updatedBy: currentUser.name
        });
      } else if (techNote.trim()) {
        newTimeline.push({
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toISOString(),
          status: report.status,
          note: `Catatan Teknisi: ${techNote.trim()}`,
          updatedBy: currentUser.name
        });
      }

      const updates: Partial<Report> = {
        status,
        assignedTo,
        estimateFinish,
        afterPhotos,
        timeline: newTimeline
      };

      await onUpdateReport(report.id!, updates, currentUser.name);
      setTechNote('');
      alert("Laporan berhasil diperbarui!");
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui laporan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Laporan (Admin Only)
  const handleDeleteReport = async () => {
    if (!onDeleteReport) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus tiket laporan ini secara permanen dari database?")) {
      setIsDeleting(true);
      try {
        await onDeleteReport(report.id!);
        onClose();
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus laporan.");
        setIsDeleting(false);
      }
    }
  };

  // Priority color formatting
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in flex flex-col my-8 max-h-[90vh]">
        
        {/* TOP BAR / HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-primary text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded font-bold font-mono">TIKET</span>
            <div>
              <h2 className="font-extrabold text-base md:text-lg flex items-center gap-2">
                {report.ticketNumber}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-slate-800 shrink-0`}>
                  {report.status}
                </span>
              </h2>
              <p className="text-[10px] text-emerald-100 font-light truncate max-w-[300px] md:max-w-none">
                Reporter: {report.reporter} ({report.division}) • {new Date(report.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser.role === 'Administrator' && onDeleteReport && (
              <button
                onClick={handleDeleteReport}
                disabled={isDeleting}
                className="p-2 hover:bg-red-600/30 rounded-xl transition text-red-100 hover:text-red-300"
                title="Hapus Tiket Laporan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENTS (SCROLLABLE) */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          
          {/* Progress Percentage Strip */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Progres Kerja:</span>
              <span className="text-sm font-extrabold text-primary">{getStatusProgress(report.status)}%</span>
            </div>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden max-w-md w-full">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${getStatusProgress(report.status)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Terakhir diupdate: {new Date(report.updatedAt).toLocaleString('id-ID')}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: COMPLAINT DETAILS & PHOTOS (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card: Complaint Core Details */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 font-mono px-2 py-0.5 rounded font-semibold text-slate-500 dark:text-slate-300">
                      {report.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{report.title}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityColors[report.priority]}`}>
                    Prioritas {report.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-700/50 whitespace-pre-line">
                  {report.description}
                </p>

                {/* Grid location details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Lokasi Utama</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{report.location}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Gedung / Sektor</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{report.building}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Lantai</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{report.floor}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Ruangan / Detail</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{report.room || '-'}</p>
                  </div>
                </div>

                {/* Linked Asset Details */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Kode Aset Terhubung</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{report.assetCode || 'NON-ASSET'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Nama / Keterangan Aset</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{report.assetName || 'Sarana Umum / Non-Asset'}</p>
                  </div>
                </div>

                {/* GPS Attachment */}
                {report.gps && (
                  <div className="pt-2 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>Geotag Koordinat: {report.gps.latitude.toFixed(6)}, {report.gps.longitude.toFixed(6)}</span>
                  </div>
                )}
              </div>

              {/* Photos Comparison Panel (Before vs After) */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-primary" />
                  <span>Dokumentasi Foto Kerusakan & Hasil Perbaikan</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Photos */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded">FOTO SEBELUM (KERUSAKAN)</span>
                    {report.beforePhotos && report.beforePhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {report.beforePhotos.map((imgUrl, i) => (
                          <div key={i} className="aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                            <img src={imgUrl} alt={`Sebelum ${i}`} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400">
                        Tidak ada foto sebelum perbaikan.
                      </div>
                    )}
                  </div>

                  {/* After Photos */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">FOTO SESUDAH (PERBAIKAN)</span>
                    {report.afterPhotos && report.afterPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {report.afterPhotos.map((imgUrl, i) => (
                          <div key={i} className="aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                            <img src={imgUrl} alt={`Sesudah ${i}`} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400">
                        Belum ada foto hasil perbaikan dari teknisi.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Feed Area */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-700 pb-3">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Diskusi & Komentar</span>
                </h4>

                {/* Comment Feed list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {(!report.comments || report.comments.length === 0) ? (
                    <p className="text-xs text-slate-400 text-center py-6">Belum ada komentar diskusi. Mulai kirim pesan untuk berkoordinasi dengan tim teknisi GA.</p>
                  ) : (
                    report.comments.map(c => {
                      const isMe = c.userEmail.toLowerCase() === currentUser.email.toLowerCase();
                      const roleColors = {
                        'Administrator': 'bg-rose-50 text-rose-600 dark:bg-rose-950/30',
                        'GA': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30',
                        'Pegawai': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      };
                      return (
                        <div key={c.id} className={`flex flex-col space-y-1 max-w-[85%] text-xs ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                            <span>{c.userName}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] uppercase ${roleColors[c.userRole] || 'bg-slate-100 text-slate-600'}`}>{c.userRole}</span>
                            <span>•</span>
                            <span className="font-mono">{new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-200/40 dark:border-slate-600/40'}`}>
                            {c.commentText}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment Form input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Tulis komentar koordinasi di sini..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition shadow flex items-center justify-center shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>

            {/* COLUMN 2: TIMELINE & ADMINISTRATIVE CONTROLS (Span 1) */}
            <div className="space-y-6">
              
              {/* Card: Vertical Timeline */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-50 dark:border-slate-700 pb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Lini Masa Pekerjaan</span>
                </h4>

                <div className="relative border-l-2 border-slate-100 dark:border-slate-700 pl-4 ml-2 space-y-6 text-xs">
                  {report.timeline && report.timeline.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 bg-primary shadow-sm flex items-center justify-center text-[8px] text-white">
                        ✓
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-primary font-bold">
                            {new Date(evt.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(evt.time).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-100 text-[11px] uppercase tracking-wide">
                          {evt.status}
                        </h5>
                        <p className="text-slate-500 font-light text-[10px] leading-relaxed">
                          {evt.note}
                        </p>
                        <span className="text-[9px] text-slate-400 font-semibold italic block">Oleh: {evt.updatedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card: GA/Admin Control Panel */}
              {isGAOrAdmin && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-5">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-50 dark:border-slate-700 pb-3 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    <span>Kelola Perbaikan (GA & Admin)</span>
                  </h4>

                  <div className="space-y-4 text-xs">
                    {/* Status Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Status Laporan</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="Menunggu">Menunggu</option>
                        <option value="Diverifikasi">Diverifikasi</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Menunggu Sparepart">Menunggu Sparepart</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Ditolak">Ditolak</option>
                      </select>
                    </div>

                    {/* Assigned To (PIC) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tentukan PIC / Teknisi</label>
                      <input
                        type="text"
                        placeholder="Ketik nama PIC/Teknisi..."
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    {/* Estimasi Selesai */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Selesai Pekerjaan</label>
                      <input
                        type="date"
                        value={estimateFinish}
                        onChange={(e) => setEstimateFinish(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    {/* Upload Post-Repair Photos (After Photos) */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Foto Hasil Kerja (After)</label>
                      <div className="border border-dashed border-slate-200 dark:border-slate-700 hover:border-primary p-3 rounded-xl text-center cursor-pointer relative group transition">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleAfterPhotoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-slate-400 group-hover:text-primary transition text-[10px]">
                          <Upload className="w-5 h-5 mx-auto mb-1 text-slate-300 group-hover:text-primary" />
                          <span>Klik untuk unggah foto hasil</span>
                        </div>
                      </div>

                      {/* Post-Repair thumbnails */}
                      {afterPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {afterPhotos.map((photo, index) => (
                            <div key={index} className="relative w-11 h-11 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                              <img src={photo} alt={`After thumb ${index}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeAfterPhoto(index)}
                                className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Catatan Teknisi / Log update note */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Teknisi / Alasan Update</label>
                      <textarea
                        rows={3}
                        placeholder="Ketik keterangan detail pekerjaan, penggantian sparepart, atau alasan penolakan tiket di sini..."
                        value={techNote}
                        onChange={(e) => setTechNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed"
                      ></textarea>
                    </div>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={handleSaveAdminChanges}
                      disabled={isSaving}
                      className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Simpan Pembaruan GA</span>
                        </>
                      )}
                    </button>

                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* FOOTER BAR */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition"
          >
            Tutup Detail
          </button>
        </div>

      </div>
    </div>
  );
}
