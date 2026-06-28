import React, { useState, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { 
  Plus, Search, QrCode, Calendar, MapPin, Wrench, 
  Trash2, ShieldCheck, Download, Printer, Tag, 
  HelpCircle, Sparkles, CheckCircle, ChevronRight, X, AlertTriangle 
} from 'lucide-react';
import { Asset, Report, Location, Category, UserProfile } from '../types';

interface AssetsViewProps {
  assets: Asset[];
  reports: Report[];
  locations: Location[];
  categories: Category[];
  currentUser: UserProfile;
  onCreateAsset: (asset: Omit<Asset, "id">) => Promise<Asset>;
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => Promise<void>;
  onTriggerReportWithAsset: (assetCode: string) => void;
}

export default function AssetsView({ 
  assets, 
  reports, 
  locations, 
  categories, 
  currentUser,
  onCreateAsset, 
  onUpdateAsset,
  onTriggerReportWithAsset
}: AssetsViewProps) {
  
  const isGAOrAdmin = currentUser.role === 'GA' || currentUser.role === 'Administrator';
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Modals & Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showScannerSim, setShowScannerSim] = useState(false);
  const [simScanCode, setSimScanCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Add Asset Form States
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('AC');
  const [location, setLocation] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('Lantai 1');
  const [room, setRoom] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [assetValue, setAssetValue] = useState(0);
  const [condition, setCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');

  // Preventive Maintenance Scheduler form
  const [maintDate, setMaintDate] = useState('');
  const [maintType, setMaintType] = useState('Pemeliharaan Preventif');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState(0);
  const [maintTech, setMaintTech] = useState('');

  // Handle building autocomplete from locations
  const handleLocationChange = (locName: string) => {
    setLocation(locName);
    const found = locations.find(l => l.name === locName);
    if (found) {
      setBuilding(found.building);
    }
  };

  // Generate unique asset code preview
  const handleOpenAddForm = () => {
    setShowAddForm(true);
    // Autofill unique next asset code
    let maxNum = 0;
    assets.forEach(a => {
      if (a.assetCode.startsWith('AST-')) {
        const num = parseInt(a.assetCode.split('-')[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    setAssetCode(`AST-${String(maxNum + 1).padStart(3, '0')}`);
  };

  // Create Asset Submission
  const handleAddAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    try {
      const payload: Omit<Asset, "id"> = {
        assetCode,
        assetName,
        category,
        location,
        building,
        floor,
        room,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        assetValue: Number(assetValue) || 0,
        condition,
        maintenanceHistory: [],
        createdAt: new Date().toISOString()
      };

      await onCreateAsset(payload);
      
      // Reset form states
      setAssetName('');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setAssetValue(0);
      setShowAddForm(false);
      setToastMessage(`Aset ${assetCode} berhasil didaftarkan!`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal menambahkan aset.");
    }
  };

  // Add Preventive Maintenance Log Submit
  const handleAddMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !maintDesc.trim()) return;

    const newLog = {
      date: maintDate || new Date().toISOString().split('T')[0],
      type: maintType,
      description: maintDesc.trim(),
      cost: Number(maintCost) || 0,
      performedBy: maintTech.trim() || 'Teknisi GA'
    };

    try {
      const updatedMaint = [...(selectedAsset.maintenanceHistory || []), newLog];
      
      // Update asset
      await onUpdateAsset(selectedAsset.id!, {
        maintenanceHistory: updatedMaint
      });

      // Update selected modal display
      setSelectedAsset(prev => prev ? { ...prev, maintenanceHistory: updatedMaint } : null);

      // Reset maintenance form states
      setMaintDesc('');
      setMaintCost(0);
      setMaintTech('');
      setToastMessage("Riwayat maintenance berhasil ditambahkan!");
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Master Filter Asset list
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const textMatch = !searchQuery.trim() ||
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.model.toLowerCase().includes(searchQuery.toLowerCase());

      const condMatch = !filterCondition || a.condition === filterCondition;
      const catMatch = !filterCategory || a.category === filterCategory;

      return textMatch && condMatch && catMatch;
    });
  }, [assets, searchQuery, filterCondition, filterCategory]);

  // Find linked damage reports for selected asset
  const assetDamageHistory = useMemo(() => {
    if (!selectedAsset) return [];
    return reports.filter(r => r.assetCode === selectedAsset.assetCode);
  }, [reports, selectedAsset]);

  // Simulate scanning QR Code
  const handleSimulatedScan = () => {
    if (!simScanCode.trim()) return;
    const match = assets.find(a => a.assetCode.toLowerCase() === simScanCode.toLowerCase());
    
    if (match) {
      setShowScannerSim(false);
      setSimScanCode('');
      // Trigger new complaint with prefilled details
      onTriggerReportWithAsset(match.assetCode);
    } else {
      alert("Kode asset tidak ditemukan di database sekolah. Pastikan format penulisan benar, contoh: AST-001");
    }
  };

  // Print QR Code util
  const handlePrintQr = (assetCode: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak QR - ${assetCode}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px solid #ccc; border-radius: 12px; padding: 20px; display: inline-block; width: 250px; }
            .code { font-weight: bold; font-size: 20px; margin-top: 15px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>SCB-CARE</h2>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${assetCode}" alt="QR" />
            <div class="code">${assetCode}</div>
            <p style="font-size: 11px; color: #666;">Pindai kode untuk melaporkan kerusakan aset sekolah</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Toast alert popup */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Main Action strip */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Registrasi & Inventaris Aset Sekolah
          </h1>
          <p className="text-xs text-slate-400">Database aset sarana prasarana lengkap dengan histori pemeliharaan preventif</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* QR Scan Simulator Button */}
          <button
            onClick={() => setShowScannerSim(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-primary" />
            <span>Simulasi Pindai QR</span>
          </button>

          {isGAOrAdmin && (
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aset Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari Kode, Nama, Merk, Tipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none"
          />
          <div className="absolute left-3.5 top-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
        </div>

        {/* Condition Filter */}
        <select
          value={filterCondition}
          onChange={(e) => setFilterCondition(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Semua Kondisi</option>
          <option value="Baik">Kondisi: Baik</option>
          <option value="Rusak Ringan">Kondisi: Rusak Ringan</option>
          <option value="Rusak Berat">Kondisi: Rusak Berat</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat.name} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* ASSET GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-16 text-center text-slate-400 col-span-full">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <span className="font-semibold block text-slate-700 dark:text-slate-200">Aset tidak ditemukan</span>
            <p className="text-xs text-slate-400 mt-1">Gunakan filter atau kata pencarian lain</p>
          </div>
        ) : (
          filteredAssets.map(asset => {
            // Colors for condition
            const condColors = {
              'Baik': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20',
              'Rusak Ringan': 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20',
              'Rusak Berat': 'bg-red-50 text-red-600 dark:bg-red-950/20 font-bold'
            };

            return (
              <div
                key={asset.assetCode}
                onClick={() => setSelectedAsset(asset)}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md cursor-pointer transition flex flex-col justify-between material-card"
              >
                <div className="space-y-3">
                  {/* Top row */}
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {asset.assetCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${condColors[asset.condition] || 'bg-slate-100'}`}>
                      Kondisi: {asset.condition}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug truncate">
                    {asset.assetName}
                  </h3>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{asset.location} ({asset.room || 'Umum'})</span>
                  </p>
                </div>

                {/* Footer specs */}
                <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center text-[11px] text-slate-400">
                  <span className="bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-500">
                    {asset.category}
                  </span>
                  
                  <div className="flex items-center gap-1 text-primary hover:text-primary-hover font-bold">
                    <span>Lihat Histori & QR</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QR SCANNER SIMULATION MODAL */}
      {showScannerSim && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in flex flex-col">
            <div className="p-5 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Simulasi Scan QR Code Aset</h3>
              </div>
              <button onClick={() => setShowScannerSim(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="border-4 border-dashed border-primary/40 rounded-2xl p-8 bg-slate-50 dark:bg-slate-900/30 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                
                <QrCode className="w-20 h-20 text-primary opacity-60 animate-pulse" />
                
                {/* Horizontal scanner beam line */}
                <div className="w-[90%] h-0.5 bg-rose-500 shadow-lg absolute top-1/2 left-0 right-0 animate-bounce"></div>
              </div>

              <div className="space-y-3 text-xs text-slate-500">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Hubungkan Tiket via Kode QR Aset Sekolah</p>
                <p className="leading-relaxed font-light text-[11px]">
                  Ketik kode aset sekolah di bawah ini (misalnya: <strong className="font-mono text-primary">AST-001</strong> atau <strong className="font-mono text-primary">AST-005</strong>) untuk menyimulasikan hasil pemindaian kamera smartphone.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  placeholder="Ketik Kode Aset (contoh: AST-001)"
                  value={simScanCode}
                  onChange={(e) => setSimScanCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold text-sm text-slate-800 dark:text-slate-200 uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSimulatedScan(); }}
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSimScanCode('AST-001')}
                    className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded font-mono text-[10px]"
                  >
                    AST-001 (AC)
                  </button>
                  <button
                    onClick={() => setSimScanCode('AST-005')}
                    className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded font-mono text-[10px]"
                  >
                    AST-005 (Pompa)
                  </button>
                  <button
                    onClick={() => setSimScanCode('AST-008')}
                    className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded font-mono text-[10px]"
                  >
                    AST-008 (Genset)
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowScannerSim(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSimulatedScan}
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl"
              >
                Simulasikan Beep Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED ASSET MODAL & PREVENTIVE SCHEDULER */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            {/* Modal Topbar */}
            <div className="p-5 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-extrabold text-base md:text-lg">{selectedAsset.assetName}</h3>
                  <p className="text-[10px] text-emerald-100 font-mono uppercase">{selectedAsset.assetCode} • {selectedAsset.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              
              {/* Asset QR Section and Core Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* QR Code and Actions Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <QRCode
                      value={selectedAsset.assetCode}
                      size={130}
                      level="H"
                      className="mx-auto"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold">QR CODE IDENTITAS</span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{selectedAsset.assetCode}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => handlePrintQr(selectedAsset.assetCode)}
                      className="py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak QR</span>
                    </button>
                    <button
                      onClick={() => onTriggerReportWithAsset(selectedAsset.assetCode)}
                      className="py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-[10px] font-bold text-white flex items-center justify-center gap-1 transition"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Laporkan</span>
                    </button>
                  </div>
                </div>

                {/* Core Specifications Sheet */}
                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b pb-2">Spesifikasi & Penempatan Aset</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Merk / Brand</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedAsset.brand || 'Tidak Tertera'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Model / Tipe</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedAsset.model || 'Tidak Tertera'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Serial Number</span>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedAsset.serialNumber || 'Tidak Tertera'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Tanggal Pembelian</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Nilai Aset (Rupiah)</span>
                      <p className="font-bold text-primary">Rp {(selectedAsset.assetValue || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Penempatan Ruangan</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedAsset.location} / Room: {selectedAsset.room || 'Umum'}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Maintenance Scheduler form (GA/Admin Only) & Preventive List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Maintenance Log & History */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b pb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Log Maintenance Preventif</span>
                  </h4>

                  {(!selectedAsset.maintenanceHistory || selectedAsset.maintenanceHistory.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 text-xs font-light">
                      Belum ada riwayat preventive maintenance untuk aset ini.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50 space-y-3 max-h-60 overflow-y-auto pr-1">
                      {selectedAsset.maintenanceHistory.map((hist, i) => (
                        <div key={i} className="pt-3 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span>{new Date(hist.date).toLocaleDateString('id-ID')}</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded uppercase">{hist.type}</span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{hist.description}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-light">
                            <span>Teknisi: {hist.performedBy}</span>
                            <span className="font-bold text-primary">Biaya: Rp {hist.cost.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Log new Maintenance event (GA/Admin Only) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b pb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Log Jadwal / Aktivitas Pemeliharaan Baru</span>
                  </h4>

                  {isGAOrAdmin ? (
                    <form onSubmit={handleAddMaintSubmit} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Kerja</label>
                          <input
                            type="date"
                            value={maintDate}
                            onChange={(e) => setMaintDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Jenis Pemeliharaan</label>
                          <select
                            value={maintType}
                            onChange={(e) => setMaintType(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                          >
                            <option value="Pemeliharaan Preventif">Preventive (Rutin)</option>
                            <option value="Perbaikan Besar">Overhaul / Korektif</option>
                            <option value="Kalibrasi Alat">Kalibrasi</option>
                            <option value="Pembersihan">Pembersihan / Cuci</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Deskripsi Pekerjaan Pemeliharaan</label>
                        <input
                          type="text"
                          placeholder="Contoh: Pembersihan saringan AC, tambah freon R32..."
                          value={maintDesc}
                          onChange={(e) => setMaintDesc(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Biaya Pemeliharaan (Rp)</label>
                          <input
                            type="number"
                            value={maintCost}
                            onChange={(e) => setMaintCost(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Teknisi / Vendor Pelaksana</label>
                          <input
                            type="text"
                            placeholder="Contoh: Indo Teknik / Slamet"
                            value={maintTech}
                            onChange={(e) => setMaintTech(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition shadow"
                      >
                        Simpan Catatan Pemeliharaan
                      </button>
                    </form>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 font-light border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                      Hanya personil GA dan Administrator yang diizinkan untuk menambah log preventive maintenance.
                    </div>
                  )}
                </div>

              </div>

              {/* Linked Damage Ticket History */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b pb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Histori Kerusakan Aset ({assetDamageHistory.length} Kasus)</span>
                </h4>

                {assetDamageHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-light">
                    Sangat baik! Aset ini belum pernah dilaporkan mengalami kerusakan.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1 text-xs">
                    {assetDamageHistory.map(rep => (
                      <div key={rep.ticketNumber} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-700/50 rounded-xl flex justify-between items-center">
                        <div className="space-y-0.5 truncate pr-2">
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-400 block">{rep.ticketNumber}</span>
                          <h5 className="font-bold text-slate-850 dark:text-slate-200 truncate">{rep.title}</h5>
                          <span className="text-[10px] text-slate-400 font-light">Dilaporkan: {new Date(rep.createdAt).toLocaleDateString('id-ID')} oleh {rep.reporter}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {rep.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition"
              >
                Tutup Detail Aset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
