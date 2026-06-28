import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Calendar, User, Mail, ShieldAlert, 
  MapPin, Upload, Image as ImageIcon, X, HelpCircle, 
  Search, CheckCircle, Crosshair, QrCode, AlertCircle 
} from 'lucide-react';
import { Report, Asset, Location, Category, UserProfile } from '../types';
import { generateTicketNumber } from '../dbService';

interface CreateReportViewProps {
  currentUser: UserProfile;
  assets: Asset[];
  locations: Location[];
  categories: Category[];
  prefilledAssetCode?: string; // If redirected from QR Code scan
  onSubmit: (report: Omit<Report, "ticketNumber">) => Promise<any>;
  onSuccessRedirect: () => void;
}

export default function CreateReportView({ 
  currentUser, 
  assets, 
  locations, 
  categories, 
  prefilledAssetCode, 
  onSubmit, 
  onSuccessRedirect 
}: CreateReportViewProps) {
  
  // Auto-calculated Ticket Number Preview
  const [ticketPreview, setTicketPreview] = useState('SCB-2026-......');
  
  // Form States
  const [date, setDate] = useState('');
  const [reporter, setReporter] = useState('');
  const [email, setEmail] = useState('');
  const [division, setDivision] = useState('Asrama');
  const [locationName, setLocationName] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('Lantai 1');
  const [room, setRoom] = useState('');
  const [categoryName, setCategoryName] = useState('Lainnya');
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat'>('Sedang');
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  
  // Auxiliary UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [showAssetLookup, setShowAssetLookup] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Prefill dates and user details on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setReporter(currentUser.name || '');
    setEmail(currentUser.email || '');
    setDivision(currentUser.division || 'Asrama');
    
    // Fetch live ticket number preview
    generateTicketNumber().then(num => setTicketPreview(num)).catch(() => {});
  }, [currentUser]);

  // Handle Prefilled Asset from QR Scanner
  useEffect(() => {
    if (prefilledAssetCode) {
      const foundAsset = assets.find(a => a.assetCode.toLowerCase() === prefilledAssetCode.toLowerCase());
      if (foundAsset) {
        selectAsset(foundAsset);
        setToastMessage(`Aset ${foundAsset.assetCode} berhasil dipindai & dimuat!`);
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        setAssetCode(prefilledAssetCode);
      }
    }
  }, [prefilledAssetCode, assets]);

  // Automatically update building when locationName changes
  useEffect(() => {
    const matchedLoc = locations.find(l => l.name === locationName);
    if (matchedLoc) {
      setBuilding(matchedLoc.building);
    }
  }, [locationName, locations]);

  // Handle Asset Selection
  const selectAsset = (asset: Asset) => {
    setAssetCode(asset.assetCode);
    setAssetName(asset.assetName);
    setCategoryName(asset.category);
    setLocationName(asset.location);
    setBuilding(asset.building || '');
    setFloor(asset.floor || 'Lantai 1');
    setRoom(asset.room || '');
    setShowAssetLookup(false);
    setAssetSearchQuery('');
  };

  // Filtered Assets for Search Lookup Panel
  const filteredAssets = useMemo(() => {
    if (!assetSearchQuery) return assets;
    return assets.filter(a => 
      a.assetCode.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
      a.assetName.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(assetSearchQuery.toLowerCase())
    );
  }, [assets, assetSearchQuery]);

  // Get current GPS Coordinates
  const fetchGpsLocation = () => {
    setGpsLoading(true);
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation tidak didukung oleh browser Anda.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (error) => {
        console.warn("GPS failed, simulating school coordinates", error);
        // Fallback to Sekolah Cendekia BAZNAS (Bogor, Indonesia) coordinates
        setGps({
          latitude: -6.533215,
          longitude: 106.711843
        });
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // Convert File uploads to compressed base64 strings to ensure durable and cheap storage
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - beforePhotos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          // Canvas resizing to compact sizes (~100KB per photo)
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
          
          // Compress quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setBeforePhotos(prev => [...prev, compressedDataUrl]);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove uploaded photo
  const removePhoto = (index: number) => {
    setBeforePhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Harap lengkapi judul dan deskripsi laporan kerusakan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<Report, "ticketNumber"> = {
        reporter,
        email,
        division,
        location: locationName || "Lainnya",
        building: building || "Lainnya",
        floor,
        room: room || "Umum",
        category: categoryName,
        assetCode: assetCode || "NON-ASSET",
        assetName: assetName || "Non-Asset / Infrastruktur Umum",
        title,
        description,
        priority,
        status: 'Menunggu',
        beforePhotos,
        afterPhotos: [],
        timeline: [
          {
            id: "1",
            time: new Date().toISOString(),
            status: "Menunggu",
            note: "Tiket pengaduan berhasil dikirim oleh " + reporter,
            updatedBy: reporter
          }
        ],
        comments: [],
        gps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSubmit(payload);
      onSuccessRedirect();
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Gagal mengirim laporan. Silakan periksa koneksi Anda dan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Form Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary text-white rounded-2xl shadow-md">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Buat Laporan Kerusakan</h1>
          <p className="text-xs text-slate-400">Laporkan kerusakan aset atau sarana prasarana sekolah agar segera ditangani GA</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* SECTION 1: KEPALAN TIKET */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-50 dark:border-slate-700/50 pb-3 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Informasi Laporan & Tiket
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Nomor Tiket Preview */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Nomor Tiket (Otomatis)</label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 font-mono text-sm text-slate-700 dark:text-slate-300 font-extrabold">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>{ticketPreview}</span>
              </div>
            </div>

            {/* Tanggal */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Tanggal Pengaduan</label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{date}</span>
              </div>
            </div>

            {/* Divisi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Divisi Pelapor</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="Asrama">Asrama</option>
                <option value="Akademik">Akademik</option>
                <option value="Operasional">Operasional</option>
              </select>
            </div>

            {/* Nama Pelapor */}
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-slate-500">Nama Pelapor</label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <User className="w-4 h-4 text-slate-400" />
                <span>{reporter}</span>
              </div>
            </div>

            {/* Email Pelapor */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500">Email Pelapor</label>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 truncate">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="truncate">{email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: INTEGRASI DATA ASET */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700/50 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Pencarian & Scan Aset
            </h3>
            <button
              type="button"
              onClick={() => setShowAssetLookup(true)}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-bold transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari dari Daftar Aset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kode Asset */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-500 flex justify-between">
                <span>Kode Asset</span>
                <span className="text-[10px] text-slate-400 font-normal">Opsional untuk sarpras umum</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: AST-001"
                  value={assetCode}
                  onChange={(e) => {
                    setAssetCode(e.target.value);
                    const matching = assets.find(a => a.assetCode.toLowerCase() === e.target.value.toLowerCase());
                    if (matching) {
                      setAssetName(matching.assetName);
                      setCategoryName(matching.category);
                      setLocationName(matching.location);
                      setBuilding(matching.building || '');
                      setFloor(matching.floor || 'Lantai 1');
                      setRoom(matching.room || '');
                    }
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
                <div className="absolute right-3 top-3.5 text-slate-400">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Nama Asset */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Nama Asset / Jenis Kerusakan Sarpras</label>
              <input
                type="text"
                placeholder="Contoh: AC Daikin, Meja Belajar, Plafon Retak"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: LOKASI DETAIL */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-50 dark:border-slate-700/50 pb-3 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Lokasi Kejadian / Penempatan Aset
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nama Lokasi */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500">Lokasi / Area Sekolah</label>
              <select
                id="location-select"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="">-- Pilih Lokasi --</option>
                {locations.map(loc => (
                  <option key={loc.id || loc.name} value={loc.name}>
                    {loc.name} ({loc.building})
                  </option>
                ))}
              </select>
            </div>

            {/* Gedung */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Gedung / Kategori Zone</label>
              <input
                type="text"
                placeholder="Autofill dari Lokasi"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400"
              />
            </div>

            {/* Lantai */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Lantai</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="Lantai 1">Lantai 1</option>
                <option value="Lantai 2">Lantai 2</option>
                <option value="Lantai 3">Lantai 3</option>
                <option value="Outdoor">Outdoor / Luar Ruangan</option>
              </select>
            </div>

            {/* Ruangan */}
            <div className="space-y-1 md:col-span-4">
              <label className="text-xs font-bold text-slate-500">Ruangan / Keterangan Tambahan Posisi</label>
              <input
                type="text"
                placeholder="Contoh: Kamar 12, Samping Wastafel, Koridor Depan Kelas 11B"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: DETAIL KERUSAKAN */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-50 dark:border-slate-700/50 pb-3 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Detail Keluhan & Masalah
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kategori Kerusakan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Kategori Kerusakan</label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                {(() => {
                  const finalCats = categories && categories.length > 0 ? categories : [
                    { name: "Fasilitas Bangunan / Fisik" },
                    { name: "Instalasi Kelistrikan" },
                    { name: "Saluran Air & Toilet" },
                    { name: "Mebel / Furniture" },
                    { name: "Elektronik & AC" },
                    { name: "Jaringan Internet" },
                    { name: "Sistem CCTV & Kamera" },
                    { name: "Fasilitas Asrama" },
                    { name: "Fasilitas Kelas & Akademik" },
                    { name: "Sarana Prasarana Olahraga" },
                    { name: "Lainnya" }
                  ];
                  return finalCats.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* Tingkat Prioritas */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500">Tingkat Prioritas Laporan</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'Rendah', color: 'hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-950/20 peer-checked:text-blue-600', dot: 'bg-blue-400' },
                  { value: 'Sedang', color: 'hover:border-yellow-500 peer-checked:border-yellow-500 peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-950/20 peer-checked:text-yellow-600', dot: 'bg-yellow-400' },
                  { value: 'Tinggi', color: 'hover:border-orange-500 peer-checked:border-orange-500 peer-checked:bg-orange-50 dark:peer-checked:bg-orange-950/20 peer-checked:text-orange-600', dot: 'bg-orange-500' },
                  { value: 'Darurat', color: 'hover:border-rose-600 peer-checked:border-rose-600 peer-checked:bg-rose-50 dark:peer-checked:bg-rose-950/20 peer-checked:text-rose-600 font-extrabold', dot: 'bg-rose-600 animate-ping' }
                ].map(opt => (
                  <div key={opt.value} className="relative">
                    <input
                      type="radio"
                      name="priority"
                      id={`p-${opt.value}`}
                      value={opt.value}
                      checked={priority === opt.value}
                      onChange={() => setPriority(opt.value as any)}
                      className="sr-only peer"
                    />
                    <label
                      htmlFor={`p-${opt.value}`}
                      className={`flex flex-col md:flex-row items-center justify-center gap-1.5 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition text-center text-slate-600 dark:text-slate-400 ${opt.color}`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`}></span>
                      <span>{opt.value}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Judul Kerusakan */}
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-slate-500">Judul Kerusakan (Singkat)</label>
              <input
                type="text"
                placeholder="Contoh: Gagang pintu asrama putus"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition font-semibold"
              />
            </div>

            {/* Deskripsi Kerusakan */}
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-slate-500">Deskripsi Detail Kerusakan & Kronologi</label>
              <textarea
                rows={4}
                placeholder="Mohon sebutkan apa masalahnya, bagian mana yang rusak, dan bagaimana kondisinya saat ini secara jelas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition leading-relaxed"
              ></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 5: MEDIA & GPS */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-50 dark:border-slate-700/50 pb-3 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Bukti Foto Kerusakan & Geotag GPS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Foto */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">
                Foto Kerusakan (Maksimal 5 Foto)
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={beforePhotos.length >= 5}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-2 text-slate-400 dark:text-slate-500 group-hover:text-primary transition">
                  <Upload className="w-8 h-8 mx-auto" />
                  <p className="text-xs font-semibold">Tarik & lepas berkas, atau klik untuk unggah</p>
                  <p className="text-[10px]">Mendukung PNG, JPG. Maksimal 5 foto.</p>
                </div>
              </div>

              {/* Thumbnails */}
              {beforePhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {beforePhotos.map((photo, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={photo} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Geotagging */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">Informasi Lokasi GPS (Geotag)</span>
                <p className="text-[10px] text-slate-400 leading-relaxed font-light">
                  Sistem akan mengambil koordinat presisi Anda untuk mempercepat pencarian tim teknisi GA di lapangan.
                </p>
              </div>

              <div className="space-y-3">
                {gps ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-xs font-mono">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-bold">Geotag Berhasil:</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Lat: {gps.latitude.toFixed(6)}, Lng: {gps.longitude.toFixed(6)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>GPS belum terekam</span>
                  </div>
                )}

                {gpsError && <p className="text-[10px] text-red-500 font-medium">{gpsError}</p>}

                <button
                  type="button"
                  onClick={fetchGpsLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Memperoleh Koordinat...' : 'Ambil Lokasi GPS Terkini'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT ACTIONS */}
        <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
          <button
            type="button"
            onClick={onSuccessRedirect}
            className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Mengirim Laporan...</span>
              </>
            ) : (
              <span>Kirim Laporan Kerusakan</span>
            )}
          </button>
        </div>
      </form>

      {/* ASSET SELECTOR MODAL / SEARCH PANEL */}
      {showAssetLookup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-primary text-white">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                <div>
                  <h3 className="font-extrabold text-base">Cari / Hubungkan Aset Sekolah</h3>
                  <p className="text-[10px] text-emerald-100 font-light">Pilih aset untuk mengisi formulir lokasi otomatis secara instan</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAssetLookup(false)}
                className="p-1 rounded-full hover:bg-white/10 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik kode aset, nama aset, merk, tipe, atau kategori..."
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  autoFocus
                />
                <div className="absolute left-3.5 top-3 text-slate-400">
                  <Search className="w-4.5 h-4.5" />
                </div>
              </div>
            </div>

            {/* List area */}
            <div className="overflow-y-auto flex-1 p-4 divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <span>Aset tidak ditemukan. Coba ketik kata kunci lainnya.</span>
                </div>
              ) : (
                filteredAssets.map(asset => (
                  <div
                    key={asset.assetCode}
                    onClick={() => selectAsset(asset)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl cursor-pointer transition flex justify-between items-center group"
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded uppercase border border-slate-200 dark:border-slate-600">
                          {asset.assetCode}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 font-light">{asset.category}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-primary transition">
                        {asset.assetName}
                      </h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span>{asset.location} • {asset.building} • {asset.room}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-slate-400 group-hover:text-primary transition">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end text-xs text-slate-400">
              Menampilkan {filteredAssets.length} dari {assets.length} total aset sekolah.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
