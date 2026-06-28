import React, { useState, useRef } from 'react';
import { 
  Settings, User, Key, Database, RefreshCw, Download, 
  Upload, Sparkles, CheckCircle, ShieldAlert, Users, LogOut 
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface SettingsViewProps {
  currentUser: UserProfile;
  onChangeUserRole: (role: UserRole) => void;
  onResetDatabase: () => Promise<void>;
  onBackupDatabase: () => void;
  onRestoreDatabase: (jsonString: string) => Promise<boolean>;
}

export default function SettingsView({ 
  currentUser, 
  onChangeUserRole,
  onResetDatabase,
  onBackupDatabase,
  onRestoreDatabase
}: SettingsViewProps) {
  
  const [toastMessage, setToastMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoleSwap = (role: UserRole) => {
    onChangeUserRole(role);
    setToastMessage(`Berhasil berpindah peran menjadi: ${role}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleResetData = async () => {
    if (window.confirm("PERINGATAN: Apakah Anda yakin ingin mereset seluruh database? Seluruh data laporan kerusakan, riwayat preventive, lokasi, dan aset akan dihapus dan dikembalikan ke sampel data default bawaan sekolah.")) {
      setIsResetting(true);
      try {
        await onResetDatabase();
        setToastMessage("Database berhasil direset ke sampel data bawaan!");
        setTimeout(() => setToastMessage(''), 3000);
      } catch (e) {
        console.error(e);
        alert("Gagal mereset database.");
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Upload JSON backup handler
  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Verify JSON parseable
        const parsed = JSON.parse(text);
        
        const success = await onRestoreDatabase(text);
        if (success) {
          setToastMessage("Database berhasil direstorasi dari file cadangan!");
          setTimeout(() => setToastMessage(''), 3000);
        } else {
          alert("Gagal merestorasi database. Format JSON cadangan salah.");
        }
      } catch (err) {
        console.error(err);
        alert("Gagal membaca file backup. Pastikan file berupa JSON valid hasil ekspor SCB-CARE.");
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-xs">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 animate-bounce" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Pengaturan Sistem & Profil
        </h1>
        <p className="text-xs text-slate-400">Atur preferensi akun serta kelola cadangan database sekolah secara aman.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm text-center space-y-4">
            <div className="relative inline-block">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="avatar" 
                  className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-slate-100 dark:border-slate-700 shadow"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mx-auto border-4 border-slate-100 dark:border-slate-700 shadow">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-1 bg-emerald-500 w-4.5 h-4.5 rounded-full border-2 border-white dark:border-slate-800" title="Online"></span>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{currentUser.name}</h3>
              <p className="text-[10px] text-slate-400 font-light truncate">{currentUser.email}</p>
              <div className="pt-1.5">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-extrabold uppercase">
                  Hak Akses: {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Administration and Database controls */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Box: Database Management */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm border-b pb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-500" />
              Manajemen Data & Backup
            </h3>

            <p className="text-slate-400 font-light leading-relaxed">
              Ekspor seluruh data SCB-CARE ke komputer Anda dalam format cadangan terkompresi JSON. Anda juga dapat merestorasi data tersebut di perangkat mana saja kapan pun.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Backup Button */}
              <button
                type="button"
                onClick={onBackupDatabase}
                className="py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 hover:text-slate-850 dark:hover:bg-slate-750 border rounded-xl font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Unduh File Cadangan (.json)</span>
              </button>

              {/* Restore Button */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleRestoreUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 hover:text-slate-850 dark:hover:bg-slate-750 border rounded-xl font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Pulihkan Data (Upload JSON)</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="font-bold text-slate-700 dark:text-slate-200">Reset Sampel Bawaan</span>
                <p className="text-[10px] text-slate-400 font-light">Kembalikan data ke awal (AC, Lift, Pompa, dll) untuk pengujian cepat.</p>
              </div>

              <button
                type="button"
                onClick={handleResetData}
                disabled={isResetting}
                className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-xl font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Mereset...' : 'Reset Seluruh Database'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
