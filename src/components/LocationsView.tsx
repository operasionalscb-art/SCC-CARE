import React, { useState } from 'react';
import { 
  MapPin, Plus, Trash2, Building2, HelpCircle, CheckCircle, X,
  FileSpreadsheet, Upload, Info, AlertTriangle, Check
} from 'lucide-react';
import { Location, UserProfile } from '../types';

interface LocationsViewProps {
  locations: Location[];
  currentUser: UserProfile;
  onCreateLocation: (location: Omit<Location, "id" | "createdAt">) => Promise<any>;
  onDeleteLocation: (locationId: string) => Promise<any>;
}

export default function LocationsView({ 
  locations, 
  currentUser, 
  onCreateLocation, 
  onDeleteLocation 
}: LocationsViewProps) {
  
  const isAdmin = currentUser.role === 'Administrator';
  const [showAddForm, setShowAddForm] = useState(false);
  
  // CSV Import states
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedLocations, setParsedLocations] = useState<Omit<Location, "id" | "createdAt">[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('Asrama');
  const [toastMessage, setToastMessage] = useState('');

  // CSV Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

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
      const nameIndex = headers.findIndex(h => h === 'name' || h === 'nama' || h === 'sektor');
      const buildingIndex = headers.findIndex(h => h === 'building' || h === 'gedung' || h === 'kelompok' || h === 'grup');

      if (nameIndex === -1) {
        alert("Format CSV salah! Wajib menyertakan kolom header 'nama' atau 'name'.");
        return;
      }

      const validBuildings = ['Asrama', 'Akademik', 'Serbaguna', 'Ibadah', 'Laboratorium', 'Utama', 'Outdoor', 'Lainnya'];

      const locationsList: Omit<Location, "id" | "createdAt">[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= nameIndex) continue;

        const rawName = row[nameIndex]?.replace(/["']/g, '').trim();
        if (!rawName) continue;

        let bld = 'Lainnya';
        if (buildingIndex !== -1 && row.length > buildingIndex) {
          const rawBld = row[buildingIndex]?.replace(/["']/g, '').trim();
          const matched = validBuildings.find(v => v.toLowerCase() === rawBld.toLowerCase());
          if (matched) {
            bld = matched;
          } else if (rawBld) {
            const low = rawBld.toLowerCase();
            if (low.includes('dorm') || low.includes('asrama')) bld = 'Asrama';
            else if (low.includes('akad') || low.includes('kelas') || low.includes('sekolah')) bld = 'Akademik';
            else if (low.includes('masjid') || low.includes('ibadah') || low.includes('mushola')) bld = 'Ibadah';
            else if (low.includes('lab') || low.includes('komputer') || low.includes('sains')) bld = 'Laboratorium';
            else if (low.includes('aula') || low.includes('lapang') || low.includes('serbaguna')) bld = 'Serbaguna';
            else if (low.includes('utama') || low.includes('kantor') || low.includes('lobby') || low.includes('admin')) bld = 'Utama';
            else if (low.includes('taman') || low.includes('parkir') || low.includes('outdoor') || low.includes('luar')) bld = 'Outdoor';
          }
        }

        locationsList.push({
          name: rawName,
          building: bld
        });
      }

      setParsedLocations(locationsList);
    };
    reader.readAsText(file);
  };

  const handleImportLocations = async () => {
    if (parsedLocations.length === 0) return;
    setImporting(true);
    let successCount = 0;

    for (let i = 0; i < parsedLocations.length; i++) {
      try {
        setImportStatus(`Mengimport ${i + 1}/${parsedLocations.length}: ${parsedLocations[i].name}...`);
        await onCreateLocation(parsedLocations[i]);
        successCount++;
      } catch (err) {
        console.error("Gagal mengimport:", parsedLocations[i], err);
      }
    }

    setImporting(false);
    setImportStatus('');
    setParsedLocations([]);
    setCsvFile(null);
    setShowCSVImport(false);
    setToastMessage(`Berhasil mengimport ${successCount} lokasi sektor baru dari CSV!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await onCreateLocation({ name: name.trim(), building });
      setName('');
      setShowAddForm(false);
      setToastMessage("Sektor lokasi baru berhasil didaftarkan!");
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal menambahkan lokasi.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      alert("Hanya Administrator yang memiliki akses menghapus data lokasi.");
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus lokasi "${name}" secara permanen? Aset yang dikaitkan ke lokasi ini mungkin perlu disesuaikan kembali.`)) {
      try {
        await onDeleteLocation(id);
        setToastMessage(`Lokasi "${name}" berhasil dihapus.`);
        setTimeout(() => setToastMessage(''), 3000);
      } catch (e) {
        console.error(e);
        alert("Gagal menghapus lokasi.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 animate-bounce" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Kelola Lokasi / Sektor Sekolah
          </h1>
          <p className="text-xs text-slate-400">Daftar gedung, area, asrama, dan ruang belajar di Sekolah Cendekia BAZNAS</p>
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
              <span>Tambah Lokasi Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* CSV IMPORT PANEL */}
      {showCSVImport && isAdmin && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-md space-y-6 animate-fade-in text-xs">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div className="text-left">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Import Sektor Lokasi via CSV</h3>
                <p className="text-[10px] text-slate-400">Unggah berkas spreadsheet untuk mendaftarkan banyak sektor sekaligus</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCSVImport(false);
                setParsedLocations([]);
                setCsvFile(null);
              }}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format Instructions */}
            <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-left">
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
                      <td className="p-2">Wajib diisi. Nama sektor/ruangan (cth: <span className="font-mono">Kelas 10-A</span>, <span className="font-mono">Masjid Lt. 1</span>)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-primary">gedung</td>
                      <td className="p-2">
                        Pilihan wajib/otomatis dipetakan:<br />
                        <span className="font-mono text-[9px] font-bold text-slate-400">Asrama, Akademik, Serbaguna, Ibadah, Laboratorium, Utama, Outdoor, Lainnya</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">Contoh Isi File CSV:</span>
                <pre className="p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl font-mono text-[10px] text-slate-500 dark:text-slate-400 leading-normal block overflow-x-auto select-all">
                  nama,gedung{"\n"}
                  Asrama Syuhada,Asrama{"\n"}
                  Laboratorium Komputer,Laboratorium{"\n"}
                  Gedung Kelas 11 B,Akademik{"\n"}
                  Lapangan Futsal,Serbaguna
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
                onClick={() => document.getElementById('locations_csv_file')?.click()}
              >
                <input
                  id="locations_csv_file"
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
              {parsedLocations.length > 0 && (
                <div className="space-y-3 p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl animate-fade-in text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4 animate-bounce" />
                      <span className="font-bold text-[11px] uppercase tracking-wider">Berhasil Membaca {parsedLocations.length} Baris Sektor</span>
                    </div>
                    <button
                      onClick={() => setParsedLocations([])}
                      className="text-[10px] text-slate-400 hover:text-red-500 font-medium underline"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 border dark:border-slate-800 rounded-xl p-2 bg-white dark:bg-slate-900">
                    {parsedLocations.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b dark:border-slate-800 last:border-0 px-1 font-medium">
                        <span className="text-slate-700 dark:text-slate-300 truncate font-semibold">{p.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest text-[8px] font-bold border dark:border-slate-700">
                          {p.building}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleImportLocations}
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

      {/* ADD LOCATION MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in">
            <div className="p-5 bg-primary text-white flex justify-between items-center">
              <h3 className="font-extrabold text-base">Registrasi Sektor Lokasi Baru</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lokasi / Sektor</label>
                <input
                  type="text"
                  placeholder="Contoh: Gedung Kelas C, Gazebo Baca, Dapur Utama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Grup Bangunan / Kompleks</label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl"
                >
                  <option value="Asrama">Asrama (Gedung Asrama)</option>
                  <option value="Akademik">Akademik (Ruang Kelas & Perpustakaan)</option>
                  <option value="Serbaguna">Serbaguna (Aula & Lapangan)</option>
                  <option value="Ibadah">Ibadah (Masjid & Tempat Wudhu)</option>
                  <option value="Laboratorium">Laboratorium (IT / IPA)</option>
                  <option value="Utama">Kantor Administrasi & Lobby</option>
                  <option value="Outdoor">Outdoor / Taman / Parkiran</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
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
                Simpan Lokasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LOCATIONS DIRECTORY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => {
          // Color coding building group
          const bColors = {
            'Asrama': 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30',
            'Akademik': 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30',
            'Ibadah': 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900/30',
            'Laboratorium': 'border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:border-pink-900/30'
          };
          return (
            <div
              key={loc.id || loc.name}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between group"
            >
              <div className="space-y-1.5 truncate pr-2 text-xs">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${bColors[loc.building as keyof typeof bColors] || 'border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-750'}`}>
                  Kompleks: {loc.building}
                </span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{loc.name}</span>
                </h4>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleDelete(loc.id!, loc.name)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Hapus Sektor Lokasi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
