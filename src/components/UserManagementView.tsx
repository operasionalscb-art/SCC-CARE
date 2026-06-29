import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Shield, Trash2, Edit2, Check, X, 
  Search, Filter, CheckCircle, Mail, Briefcase, Plus, UserCheck,
  LayoutDashboard, ClipboardPlus, Sliders, ListFilter, Tag, 
  MapPin, Wrench, Clock, FileSpreadsheet, Settings 
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import * as dbService from '../dbService';

export const ACCESS_CATEGORIES = [
  { id: 'dashboard', label: 'Dashboard Analisis', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'buat-laporan', label: 'Buat Aduan', icon: <ClipboardPlus className="w-3.5 h-3.5" /> },
  { id: 'monitoring', label: 'Monitoring Master', icon: <Sliders className="w-3.5 h-3.5" /> },
  { id: 'daftar-laporan', label: 'Daftar Laporan', icon: <ListFilter className="w-3.5 h-3.5" /> },
  { id: 'data-aset', label: 'Data Aset & QR', icon: <Tag className="w-3.5 h-3.5" /> },
  { id: 'sektor-lokasi', label: 'Kelola Sektor', icon: <MapPin className="w-3.5 h-3.5" /> },
  { id: 'kategori-aduan', label: 'Kelola Kategori', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'kelola-pengguna', label: 'Kelola Pengguna', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'riwayat-pemeliharaan', label: 'Riwayat Selesai', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'rekap-laporan', label: 'Cetak Laporan', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
  { id: 'pengaturan', label: 'Pengaturan Profil', icon: <Settings className="w-3.5 h-3.5" /> },
];

export const getRoleDefaultPermissions = (role: UserRole): Record<string, boolean> => {
  return {
    'dashboard': true,
    'buat-laporan': true,
    'monitoring': role === 'GA' || role === 'Administrator',
    'daftar-laporan': true,
    'data-aset': true,
    'sektor-lokasi': role === 'Administrator',
    'kategori-aduan': role === 'Administrator',
    'kelola-pengguna': role === 'Administrator',
    'riwayat-pemeliharaan': true,
    'rekap-laporan': role === 'GA' || role === 'Administrator',
    'pengaturan': true,
  };
};

interface UserManagementViewProps {
  currentUser: UserProfile;
}

export default function UserManagementView({ currentUser }: UserManagementViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  
  // Registration Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Pegawai');
  const [regDivision, setRegDivision] = useState('Asrama');
  const [submitting, setSubmitting] = useState(false);
  const [regPermissions, setRegPermissions] = useState<Record<string, boolean>>(() => getRoleDefaultPermissions('Pegawai'));

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [divisionFilter, setDivisionFilter] = useState<string>('Semua');

  // Inline Editing States
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Pegawai');
  const [editDivision, setEditDivision] = useState('Asrama');
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});

  // Sync default permissions when registration role changes
  useEffect(() => {
    setRegPermissions(getRoleDefaultPermissions(regRole));
  }, [regRole]);

  // Load registered users on mount
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await dbService.getAllUsers();
      setUsers(allUsers);
    } catch (e) {
      console.error("Gagal memuat daftar pengguna:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search user profiles
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === 'Semua' || user.role === roleFilter;
      const matchDivision = divisionFilter === 'Semua' || user.division === divisionFilter;
      
      return matchSearch && matchRole && matchDivision;
    });
  }, [users, searchQuery, roleFilter, divisionFilter]);

  // Handle register/add user profile
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      alert("Nama dan email wajib diisi!");
      return;
    }

    setSubmitting(true);
    try {
      // Create fresh profile payload
      const newUid = "u-" + Math.random().toString(36).substr(2, 9);
      const newProfile: UserProfile = {
        uid: newUid,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        role: regRole,
        division: regDivision,
        photoURL: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&q=80&w=150`,
        createdAt: new Date().toISOString(),
        permissions: regPermissions
      };

      await dbService.createUserProfile(newProfile);
      
      // Update local state and reset forms
      setUsers(prev => [...prev, newProfile]);
      setRegName('');
      setRegEmail('');
      setRegRole('Pegawai');
      setRegDivision('Asrama');
      setRegPermissions(getRoleDefaultPermissions('Pegawai'));
      setShowAddForm(false);
      
      setToastMessage("Pengguna baru berhasil diregistrasi!");
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan registrasi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle saving inline edits
  const handleSaveInlineEdit = async (uid: string) => {
    try {
      await dbService.updateUserRoleAndDivision(uid, editRole, editDivision, editPermissions);
      
      // Update local UI state
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: editRole, division: editDivision, permissions: editPermissions } : u));
      
      // If updating oneself, sync immediately
      if (uid === currentUser.uid) {
        const updatedSelf = { ...currentUser, role: editRole, division: editDivision, permissions: editPermissions };
        localStorage.setItem('scb_care_user', JSON.stringify(updatedSelf));
      }

      setEditingUid(null);
      
      setToastMessage("Hak akses pengguna berhasil diperbarui!");
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui hak akses pengguna.");
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (uid: string, name: string) => {
    if (uid === currentUser.uid || uid === "demo-admin") {
      alert("Anda tidak dapat menghapus akun Anda sendiri atau Super Admin bawaan!");
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        if (dbService.deleteUserProfile) {
          await dbService.deleteUserProfile(uid);
        } else {
          // Fallback if not updated in dbService yet
          const local = localStorage.getItem("scb_care_users");
          if (local) {
            const usersList = JSON.parse(local) as UserProfile[];
            const filtered = usersList.filter(u => u.uid !== uid);
            localStorage.setItem("scb_care_users", JSON.stringify(filtered));
          }
        }
        
        setUsers(prev => prev.filter(u => u.uid !== uid));
        setToastMessage(`Pengguna "${name}" berhasil dihapus.`);
        setTimeout(() => setToastMessage(''), 3000);
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus pengguna.");
      }
    }
  };

  // Helper styles for roles
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
      case 'GA':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30';
    }
  };

  // Helper styles for divisions
  const getDivisionBadgeStyle = (div: string) => {
    switch (div) {
      case 'Asrama':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200/30';
      case 'Akademik':
        return 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-200/30';
      case 'Operasional':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/30';
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in text-xs">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Pengelolaan Akun & Hak Akses
          </h1>
          <p className="text-xs text-slate-400 mt-1">Kelola perizinan peran, divisi, serta daftarkan akun baru untuk otorisasi sistem SCB-CARE.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-md shrink-0"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          <span>{showAddForm ? 'Tutup Formulir' : 'Registrasi Akun Baru'}</span>
        </button>
      </div>

      {/* Registration Form Panel */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-md animate-slide-in">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm border-b dark:border-slate-700 pb-3 mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Registrasi Pengguna Baru
          </h3>

          <form onSubmit={handleRegisterUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Contoh: Muhammad Fajri"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Akun (Google)</label>
              <input
                type="email"
                placeholder="Contoh: fajri@cendekia.sch.id"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peran & Hak Akses</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="Pegawai">Pegawai (Reporter)</option>
                <option value="GA">General Affair (GA)</option>
                <option value="Administrator">Administrator (IT & Master)</option>
              </select>
            </div>

            {/* Division selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Divisi Pelapor</label>
              <select
                value={regDivision}
                onChange={(e) => setRegDivision(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="Asrama">Asrama</option>
                <option value="Akademik">Akademik</option>
                <option value="Operasional">Operasional</option>
              </select>
            </div>

            {/* Kustomisasi Hak Akses */}
            <div className="md:col-span-4 space-y-3 mt-4 pt-4 border-t dark:border-slate-700/50">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Kustomisasi Hak Akses Fitur / Menu Utama</span>
                </div>
                <span className="text-[10px] text-slate-400">Pilih menu/halaman yang dapat diakses oleh pengguna ini.</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-750/60">
                {ACCESS_CATEGORIES.map(cat => (
                  <label 
                    key={cat.id} 
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!regPermissions[cat.id]}
                      onChange={(e) => {
                        setRegPermissions(prev => ({
                          ...prev,
                          [cat.id]: e.target.checked
                        }));
                      }}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary focus:ring-2 accent-primary"
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-400 shrink-0">{cat.icon}</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate text-[11px]">{cat.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <div className="md:col-span-4 flex justify-end gap-2 pt-4 border-t dark:border-slate-700/50 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-750 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg font-bold transition"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow"
              >
                {submitting ? 'Menyimpan...' : 'Registrasikan Akun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table search and filters container */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-750 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-750 text-slate-750 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="Semua">Semua Peran</option>
              <option value="Pegawai">Pegawai</option>
              <option value="GA">General Affair</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Divisi:</span>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-750 text-slate-750 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="Semua">Semua Divisi</option>
              <option value="Asrama">Asrama</option>
              <option value="Akademik">Akademik</option>
              <option value="Operasional">Operasional</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main registered users listing */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <svg className="animate-spin h-6 w-6 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="font-semibold">Sinkronisasi data otorisasi...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-500">Tidak ada pengguna ditemukan</p>
            <p className="text-[10px]">Coba sesuaikan kata kunci pencarian atau filter peran/divisi Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Profil Pengguna</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Alamat Email</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Peran (Hak Akses)</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Divisi Pelapor</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Aksi & Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.map(user => {
                  const isEditing = editingUid === user.uid;
                  return (
                    <React.Fragment key={user.uid}>
                      <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition">
                        {/* Name & Photo column */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-full object-cover border shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                {user.name[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{user.name}</p>
                              <span className="text-[9px] text-slate-400">Terdaftar: {new Date(user.createdAt || '').toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                        </td>

                        {/* Email column */}
                        <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{user.email}</span>
                          </div>
                        </td>

                        {/* Role selection / badge column */}
                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => {
                                const newRole = e.target.value as UserRole;
                                setEditRole(newRole);
                                setEditPermissions(getRoleDefaultPermissions(newRole));
                              }}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="Pegawai">Pegawai</option>
                              <option value="GA">General Affair</option>
                              <option value="Administrator">Administrator</option>
                            </select>
                          ) : (
                            <div className="space-y-1">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${getRoleBadgeStyle(user.role)}`}>
                                {user.role}
                              </span>
                              {user.permissions && (
                                <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold flex items-center gap-1 mt-0.5">
                                  <Shield className="w-3 h-3 shrink-0" />
                                  <span>Hak Akses Kustom</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Division selection / badge column */}
                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editDivision}
                              onChange={(e) => setEditDivision(e.target.value)}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="Asrama">Asrama</option>
                              <option value="Akademik">Akademik</option>
                              <option value="Operasional">Operasional</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${getDivisionBadgeStyle(user.division)}`}>
                              {user.division || 'Asrama'}
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineEdit(user.uid)}
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 rounded-xl font-bold transition flex items-center justify-center"
                                  title="Simpan Perubahan"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUid(null)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-750 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-bold transition flex items-center justify-center"
                                  title="Batalkan"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUid(user.uid);
                                    setEditRole(user.role);
                                    setEditDivision(user.division || 'Asrama');
                                    setEditPermissions(user.permissions || getRoleDefaultPermissions(user.role));
                                  }}
                                  className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 rounded-xl font-bold transition flex items-center justify-center"
                                  title="Kelola Hak Akses Peran"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.uid, user.name)}
                                  disabled={user.uid === currentUser.uid || user.uid === 'demo-admin'}
                                  className="p-2 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 rounded-xl font-bold transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Hapus Akun Pengguna"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Permission Checklist during edit */}
                      {isEditing && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                          <td colSpan={5} className="p-4 pl-8 border-b border-slate-200/80 dark:border-slate-850">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm space-y-3">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
                                  <Shield className="w-4 h-4 text-primary" />
                                  <span>Atur Ceklist Hak Akses Otorisasi Modul</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Centang atau hapus centang untuk mengatur hak akses spesifik bagi {user.name}.</span>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                                {ACCESS_CATEGORIES.map(cat => (
                                  <label 
                                    key={cat.id} 
                                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-750 hover:bg-slate-100/70 dark:hover:bg-slate-750/70 transition cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!editPermissions[cat.id]}
                                      onChange={(e) => {
                                        setEditPermissions(prev => ({
                                          ...prev,
                                          [cat.id]: e.target.checked
                                        }));
                                      }}
                                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary focus:ring-2 accent-primary"
                                    />
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-slate-400 shrink-0">{cat.icon}</span>
                                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate text-[11px]">{cat.label}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
