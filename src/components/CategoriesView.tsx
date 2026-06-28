import React, { useState } from 'react';
import { 
  Wrench, Plus, Trash2, HelpCircle, CheckCircle, X,
  Home, Zap, Droplet, Tv, Wifi, Video, Wind, Car, Sparkles, Shield, Briefcase, FlaskConical,
  Compass, Anchor, Box, Cpu, FileText, Gift, Hammer, Settings, Trash, Umbrella,
  FileSpreadsheet, Upload, Info, AlertTriangle, Check
} from 'lucide-react';
import { Category, UserProfile } from '../types';

interface CategoriesViewProps {
  categories: Category[];
  currentUser: UserProfile;
  onCreateCategory: (category: Omit<Category, "id" | "createdAt">) => Promise<any>;
  onDeleteCategory: (categoryId: string) => Promise<any>;
}

export default function CategoriesView({ 
  categories, 
  currentUser, 
  onCreateCategory, 
  onDeleteCategory 
}: CategoriesViewProps) {
  
  const isAdmin = currentUser.role === 'Administrator';
  const [showAddForm, setShowAddForm] = useState(false);
  
  // CSV Import states
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCategories, setParsedCategories] = useState<Omit<Category, "id" | "createdAt">[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Hammer');
  const [selectedColor, setSelectedColor] = useState('bg-slate-500');
  const [toastMessage, setToastMessage] = useState('');

  // Available custom Lucide Icons to choose from
  const AVAILABLE_ICONS = [
    'Home', 'Zap', 'Droplet', 'Tv', 'Wifi', 'Video', 'Wind', 'Car', 
    'Sparkles', 'Shield', 'Briefcase', 'FlaskConical', 'Hammer', 'Settings', 
    'Box', 'Cpu', 'Gift', 'Compass', 'FileText', 'Umbrella'
  ];

  // Helper mapping icon string to actual Lucide component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Droplet': return <Droplet className="w-5 h-5" />;
      case 'Tv': return <Tv className="w-5 h-5" />;
      case 'Wifi': return <Wifi className="w-5 h-5" />;
      case 'Video': return <Video className="w-5 h-5" />;
      case 'Wind': return <Wind className="w-5 h-5" />;
      case 'Car': return <Car className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5" />;
      case 'Hammer': return <Hammer className="w-5 h-5" />;
      case 'Settings': return <Settings className="w-5 h-5" />;
      case 'Box': return <Box className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Gift': return <Gift className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'Umbrella': return <Umbrella className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  // Available Tailwind colors
  const AVAILABLE_COLORS = [
    { name: 'Emerald', bgClass: 'bg-emerald-500' },
    { name: 'Yellow', bgClass: 'bg-yellow-500' },
    { name: 'Blue', bgClass: 'bg-blue-500' },
    { name: 'Amber', bgClass: 'bg-amber-600' },
    { name: 'Indigo', bgClass: 'bg-indigo-500' },
    { name: 'Purple', bgClass: 'bg-purple-500' },
    { name: 'Rose', bgClass: 'bg-rose-500' },
    { name: 'Sky', bgClass: 'bg-sky-400' },
    { name: 'Cyan', bgClass: 'bg-cyan-600' },
    { name: 'Teal', bgClass: 'bg-teal-500' },
    { name: 'Pink', bgClass: 'bg-pink-500' },
    { name: 'Slate', bgClass: 'bg-slate-500' }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert("Hanya mendukung file dengan format .csv");
      return;
    }
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rows = text.split(/\r?\n/).map(line => {
        const delimiter = line.includes(';') ? ';' : ',';
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      }).filter(row => row.length > 0 && row.some(cell => cell !== ''));

      if (rows.length < 2) {
        alert("File CSV kosong atau tidak memiliki data baris.");
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().replace(/["']/g, '').trim());
      const nameIndex = headers.findIndex(h => h === 'name' || h === 'nama' || h === 'kategori');
      const iconIndex = headers.findIndex(h => h === 'icon' || h === 'ikon' || h === 'simbol');
      const colorIndex = headers.findIndex(h => h === 'color' || h === 'warna' || h === 'label');

      if (nameIndex === -1) {
        alert("Format CSV salah! Wajib menyertakan kolom header 'nama' atau 'name'.");
        return;
      }

      const categoriesList: Omit<Category, "id" | "createdAt">[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= nameIndex) continue;

        const rawName = row[nameIndex]?.replace(/["']/g, '').trim();
        if (!rawName) continue;

        let icon = 'Hammer';
        if (iconIndex !== -1 && row.length > iconIndex) {
          const rawIcon = row[iconIndex]?.replace(/["']/g, '').trim();
          const matched = AVAILABLE_ICONS.find(ic => ic.toLowerCase() === rawIcon.toLowerCase());
          if (matched) {
            icon = matched;
          }
        }

        let color = 'bg-slate-500';
        if (colorIndex !== -1 && row.length > colorIndex) {
          const rawColor = row[colorIndex]?.replace(/["']/g, '').trim();
          const matchedColor = AVAILABLE_COLORS.find(col => 
            col.bgClass.toLowerCase() === rawColor.toLowerCase() || 
            col.name.toLowerCase() === rawColor.toLowerCase()
          );
          if (matchedColor) {
            color = matchedColor.bgClass;
          } else if (rawColor.startsWith('bg-')) {
            color = rawColor;
          }
        }

        categoriesList.push({
          name: rawName,
          icon,
          color
        });
      }

      setParsedCategories(categoriesList);
    };
    reader.readAsText(file);
  };

  const handleImportCategories = async () => {
    if (parsedCategories.length === 0) return;
    setImporting(true);
    let successCount = 0;

    for (let i = 0; i < parsedCategories.length; i++) {
      try {
        setImportStatus(`Mengimport ${i + 1}/${parsedCategories.length}: ${parsedCategories[i].name}...`);
        await onCreateCategory(parsedCategories[i]);
        successCount++;
      } catch (err) {
        console.error("Gagal mengimport:", parsedCategories[i], err);
      }
    }

    setImporting(false);
    setImportStatus('');
    setParsedCategories([]);
    setCsvFile(null);
    setShowCSVImport(false);
    setToastMessage(`Berhasil mengimport ${successCount} kategori baru dari CSV!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await onCreateCategory({ 
        name: name.trim(), 
        icon: selectedIcon, 
        color: selectedColor 
      });
      setName('');
      setShowAddForm(false);
      setToastMessage("Kategori kerusakan baru berhasil ditambahkan!");
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal menambahkan kategori.");
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!isAdmin) {
      alert("Hanya Administrator yang memiliki akses menghapus data kategori.");
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${catName}" secara permanen? Seluruh keluhan yang terhubung ke kategori ini mungkin perlu ditata ulang.`)) {
      try {
        await onDeleteCategory(id);
        setToastMessage(`Kategori "${catName}" berhasil dihapus.`);
        setTimeout(() => setToastMessage(''), 3000);
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus kategori.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 animate-bounce" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Title block */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Kelola Kategori Kerusakan
          </h1>
          <p className="text-xs text-slate-400">Daftar klasifikasi jenis aduan untuk memudahkan pembagian tugas tim teknisi GA</p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowCSVImport(!showCSVImport)}
              className={`px-4 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${showCSVImport ? 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300'}`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* CSV IMPORT PANEL */}
      {showCSVImport && isAdmin && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-md space-y-6 animate-fade-in text-xs text-left">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Import Kategori via CSV</h3>
                <p className="text-[10px] text-slate-400">Unggah berkas spreadsheet untuk mendaftarkan banyak kategori kerusakan sekaligus</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCSVImport(false);
                setParsedCategories([]);
                setCsvFile(null);
              }}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format Instructions */}
            <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <h4 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Info className="w-4 h-4 text-primary" />
                Detail Format Dokumen CSV:
              </h4>
              <p className="text-slate-500 font-light leading-relaxed">
                Buatlah berkas Excel atau teks, kemudian simpan sebagai format <strong>.CSV (Comma Separated Values)</strong> dengan spesifikasi header kolom berikut:
              </p>
              <div className="overflow-x-auto border dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                      <th className="p-2">Header Kolom</th>
                      <th className="p-2">Deskripsi / Aturan Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800 font-light">
                    <tr>
                      <td className="p-2 font-mono font-bold text-primary">nama</td>
                      <td className="p-2">Wajib diisi. Nama kategori kerusakan (cth: <span className="font-mono">Kelistrikan</span>, <span className="font-mono">Pipa Bocor</span>)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-primary">ikon</td>
                      <td className="p-2">
                        Pilihan nama ikon Lucide (Opsional, bawaan: Hammer):<br />
                        <span className="font-mono text-[9px] font-bold text-slate-400">Home, Zap, Droplet, Tv, Wifi, Video, Wind, Car, Sparkles, Shield, Briefcase, FlaskConical, Hammer, Settings, Box, Cpu, Gift, Compass, FileText, Umbrella</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-primary">warna</td>
                      <td className="p-2">
                        Pilihan warna label Tailwind bg-class (Opsional, bawaan: bg-slate-500):<br />
                        <span className="font-mono text-[9px] font-bold text-slate-400">bg-emerald-500, bg-yellow-500, bg-blue-500, bg-amber-600, bg-indigo-500, bg-purple-500, bg-rose-500, bg-sky-400, bg-cyan-600, bg-teal-500, bg-pink-500, bg-slate-500</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">Contoh Isi File CSV:</span>
                <pre className="p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl font-mono text-[10px] text-slate-500 dark:text-slate-400 leading-normal block overflow-x-auto select-all">
                  nama,ikon,warna{"\n"}
                  Kelistrikan & Kabel,Zap,bg-amber-600{"\n"}
                  Kebocoran Air,Droplet,bg-blue-500{"\n"}
                  Fasilitas Kamar,Home,bg-emerald-500{"\n"}
                  Internet Lambat,Wifi,bg-indigo-500
                </pre>
              </div>
            </div>

            {/* Drag & Drop File Upload area */}
            <div className="flex flex-col justify-between space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-primary/40 bg-slate-50/50 dark:bg-slate-900/20'}`}
                onClick={() => document.getElementById('categories_csv_file')?.click()}
              >
                <input
                  id="categories_csv_file"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border mb-3 text-slate-400">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                {csvFile ? (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{csvFile.name}</p>
                    <p className="text-[10px] text-emerald-500 font-semibold">Berkas siap diproses</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-200">Tarik & Lepas berkas CSV di sini</p>
                    <p className="text-slate-400 font-light text-[10px]">atau klik untuk memilih file dari komputer</p>
                  </div>
                )}
              </div>

              {/* Preview parsed values if available */}
              {parsedCategories.length > 0 && (
                <div className="space-y-3 p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl animate-fade-in">
                  <div className="flex justify-between items-center font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4 animate-bounce" />
                      <span className="font-bold text-[11px] uppercase tracking-wider">Berhasil Membaca {parsedCategories.length} Kategori</span>
                    </div>
                    <button
                      onClick={() => setParsedCategories([])}
                      className="text-[10px] text-slate-400 hover:text-red-500 font-medium underline"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 border dark:border-slate-800 rounded-xl p-2 bg-white dark:bg-slate-900">
                    {parsedCategories.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b dark:border-slate-800 last:border-0 px-1 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${p.color}`}></span>
                          <span className="text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[9px]">
                          {p.icon}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleImportCategories}
                    disabled={importing}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 text-xs"
                  >
                    {importing ? (
                      <span>{importStatus}</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Konfirmasi & Mulai Import Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in">
            <div className="p-5 bg-primary text-white flex justify-between items-center">
              <h3 className="font-extrabold text-base">Buat Kategori Kerusakan Baru</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Genset, Sound System, Atap Bocor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold text-sm"
                />
              </div>

              {/* Icon grid selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Pilih Simbol / Ikon</label>
                <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border overflow-y-auto max-h-36">
                  {AVAILABLE_ICONS.map(icName => (
                    <button
                      key={icName}
                      type="button"
                      onClick={() => setSelectedIcon(icName)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition hover:bg-white hover:text-primary ${selectedIcon === icName ? 'bg-primary text-white border-primary shadow' : 'border-slate-200/50 text-slate-400 dark:border-slate-700'}`}
                    >
                      {getIconComponent(icName)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color grid selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Pilih Warna Label</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_COLORS.map(col => (
                    <button
                      key={col.bgClass}
                      type="button"
                      onClick={() => setSelectedColor(col.bgClass)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-semibold text-white transition flex items-center gap-1.5 ${col.bgClass} ${selectedColor === col.bgClass ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white shrink-0"></span>
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border text-slate-600 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
              >
                Buat Kategori
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY DIRECTORY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div
            key={cat.id || cat.name}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5 text-xs truncate pr-2">
              <div className={`p-3 rounded-2xl text-white ${cat.color || 'bg-slate-500'} shadow-sm`}>
                {getIconComponent(cat.icon || 'HelpCircle')}
              </div>
              <div className="truncate">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate">{cat.name}</h4>
                <p className="text-[10px] text-slate-400 font-light font-mono truncate">ID: {cat.icon || 'default'}</p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => handleDelete(cat.id!, cat.name)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Hapus Kategori"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
