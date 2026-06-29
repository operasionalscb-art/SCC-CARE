import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardPlus, Sliders, ListFilter, 
  Tag, MapPin, Wrench, Clock, FileSpreadsheet, Settings, 
  Menu, X, Sparkles, User, LogOut, ChevronRight, CheckCircle, ShieldAlert,
  Sun, Moon, Users, UserPlus, UserCheck, Lock, Eye, EyeOff, Mail
} from 'lucide-react';

import { Report, Asset, Location, Category, UserProfile, UserRole } from './types';
import * as dbService from './dbService';

// Import all sub-views
import DashboardView from './components/DashboardView';
import CreateReportView from './components/CreateReportView';
import MonitoringView from './components/MonitoringView';
import ReportsListView from './components/ReportsListView';
import AssetsView from './components/AssetsView';
import LocationsView from './components/LocationsView';
import CategoriesView from './components/CategoriesView';
import LaporanView from './components/LaporanView';
import SettingsView from './components/SettingsView';
import UserManagementView from './components/UserManagementView';
import ReportDetailModal from './components/ReportDetailModal';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('scb_care_auth') === 'true';
  });
  const [showLoginGate, setShowLoginGate] = useState<boolean>(false);
  
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const cached = localStorage.getItem('scb_care_user');
    if (cached) {
      try { return JSON.parse(cached); } catch(e){}
    }
    return {
      name: 'Pegawai Cendekia',
      email: 'pegawai@cendekia.sch.id',
      role: 'Pegawai',
      photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    };
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('scb_care_dark_mode') === 'true';
  });

  // Login Self-Registration States
  const [showSelfReg, setShowSelfReg] = useState(false);
  const [selfRegName, setSelfRegName] = useState('');
  const [selfRegEmail, setSelfRegEmail] = useState('');
  const [selfRegPassword, setSelfRegPassword] = useState('');
  const [selfRegDivision, setSelfRegDivision] = useState('Asrama');
  const [selfRegSuccess, setSelfRegSuccess] = useState(false);

  // Sync Dark Mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('scb_care_dark_mode', String(darkMode));
  }, [darkMode]);

  // Ensure operasional.scb@gmail.com is always Super Admin
  useEffect(() => {
    if (currentUser.email === 'operasional.scb@gmail.com' && currentUser.role !== 'Administrator') {
      setCurrentUser(prev => ({ ...prev, role: 'Administrator' }));
    }
  }, [currentUser.email]);

  // Database States
  const [reports, setReports] = useState<Report[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI Navigation States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTicketCode, setSelectedTicketCode] = useState<string | null>(null);
  const [prefilledAssetCode, setPrefilledAssetCode] = useState<string>('');

  // Initial Data Sync
  const loadDatabase = async () => {
    setIsLoading(true);
    try {
      // Ensure database is seeded with initial data if empty
      await dbService.ensureDatabaseSeeded();

      // Automatically purge demo/historical reports once to start fresh
      if (localStorage.getItem("scb_demo_reports_purged") !== "true") {
        await dbService.purgeDemoReports();
      }

      // Sync reports
      const reps = await dbService.getReports();
      setReports(reps);

      // Sync assets
      const asts = await dbService.getAssets();
      setAssets(asts);

      // Sync locations
      const locs = await dbService.getLocations();
      setLocations(locs);

      // Sync categories
      const cats = await dbService.getCategories();
      setCategories(cats);

      // Sync logged in user profile to get any updated permissions/roles
      if (currentUser && currentUser.email && currentUser.uid !== 'demo-admin') {
        const freshUser = await dbService.getUserProfileByEmail(currentUser.email);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    } catch (e) {
      console.error("Database connection failed, local backup running.", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Update localStorage cache when user changes
  useEffect(() => {
    localStorage.setItem('scb_care_user', JSON.stringify(currentUser));
    localStorage.setItem('scb_care_auth', isAuthenticated ? 'true' : 'false');
  }, [currentUser, isAuthenticated]);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Handle Login with Credentials
  const handleLoginWithCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedEmail = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!trimmedEmail || !password) {
      setLoginError('Email dan password wajib diisi.');
      return;
    }

    // 1. Check Super Admin credentials
    if (trimmedEmail === 'operasional.scb@gmail.com') {
      if (password === 'admin123') {
        const adminProfile: UserProfile = {
          uid: 'demo-admin',
          name: 'Super Admin Operasional',
          email: 'operasional.scb@gmail.com',
          role: 'Administrator',
          division: 'Operasional',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          createdAt: new Date().toISOString()
        };
        setCurrentUser(adminProfile);
        setIsAuthenticated(true);
        setLoginEmail('');
        setLoginPassword('');
        return;
      } else {
        setLoginError('Password untuk Super Admin salah! Gunakan: admin123');
        return;
      }
    }

    // 2. Check general users from dbService (Firestore/Local Storage)
    try {
      const dbProfile = await dbService.getUserProfileByEmail(trimmedEmail);
      if (dbProfile) {
        if (dbProfile.password && dbProfile.password !== password) {
          setLoginError('Password yang Anda masukkan salah!');
          return;
        }
        setCurrentUser(dbProfile);
        setIsAuthenticated(true);
        setLoginEmail('');
        setLoginPassword('');
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setLoginError('Email atau password salah! Silakan gunakan operasional.scb@gmail.com / admin123, atau gunakan email akun Anda yang telah terdaftar.');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('scb_care_auth');
  };

  // Role switching helper inside settings
  const handleChangeUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role,
      name: role === 'Pegawai' ? 'Ahmad Muzaki' : role === 'GA' ? 'Slamet Raharjo (GA)' : 'Ustadz Admin Utama'
    }));
  };

  // Triggering new report via QR Code scanning simulation
  const handleTriggerReportWithAsset = (assetCode: string) => {
    setPrefilledAssetCode(assetCode);
    setActiveTab('buat-laporan');
  };

  // Report CRUD Wire-ups
  const handleCreateReport = async (payload: any) => {
    setIsLoading(true);
    try {
      const newReport = await dbService.createReport(payload);
      
      // Update local React state instantly
      setReports(prev => [newReport, ...prev]);
      
      // Change views back to visual listings or dashboard
      setActiveTab('daftar-laporan');
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim laporan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: string, updates: Partial<Report>, updatedBy: string) => {
    try {
      await dbService.updateReport(reportId, updates, updatedBy);
      
      // Re-load fresh data from Firestore/Localfallback
      const refreshedReports = await dbService.getReports();
      setReports(refreshedReports);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await dbService.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (e) {
      console.error(e);
    }
  };

  // Asset CRUD Wire-ups
  const handleCreateAsset = async (payload: Omit<Asset, "id">) => {
    const newAsset = await dbService.createAsset(payload);
    setAssets(prev => [newAsset, ...prev]);
    return newAsset;
  };

  const handleUpdateAsset = async (assetId: string, updates: Partial<Asset>) => {
    await dbService.updateAsset(assetId, updates);
    const refreshedAssets = await dbService.getAssets();
    setAssets(refreshedAssets);
  };

  // Locations CRUD Wire-ups
  const handleCreateLocation = async (payload: Omit<Location, "id" | "createdAt">) => {
    const newLoc = await dbService.createLocation(payload);
    setLocations(prev => [...prev, newLoc]);
    return newLoc;
  };

  const handleDestroyLocation = async (id: string) => {
    await dbService.deleteLocation(id);
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  // Categories CRUD Wire-ups
  const handleCreateCategory = async (payload: Omit<Category, "id" | "createdAt">) => {
    const newCat = await dbService.createCategory(payload);
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const handleDestroyCategory = async (id: string) => {
    await dbService.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleClearReports = async () => {
    setIsLoading(true);
    try {
      await dbService.purgeDemoReports();
      const refreshedReports = await dbService.getReports();
      setReports(refreshedReports);
    } catch (e) {
      console.error(e);
      alert("Gagal mengosongkan laporan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset database entirely to mock seeds
  const handleResetDatabase = async () => {
    await dbService.clearAndSeedAll();
    await loadDatabase();
  };

  // Backup data - export current state to local JSON file
  const handleBackupDatabase = () => {
    const backupData = {
      reports,
      assets,
      locations,
      categories,
      exportedAt: new Date().toISOString(),
      system: 'SCB-CARE'
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `SCB_CARE_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore database - overwrite local memory
  const handleRestoreDatabase = async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.reports || !parsed.assets || !parsed.locations || !parsed.categories) {
        return false;
      }

      await dbService.restoreRawBackup(parsed);
      await loadDatabase();
      return true;
    } catch(e) {
      return false;
    }
  };

  // Determine which modal report is selected
  const activeInspectReport = reports.find(r => r.ticketNumber === selectedTicketCode);

  // Handle User Self-Registration on login page
  const handleSelfRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfRegName.trim() || !selfRegEmail.trim() || !selfRegPassword.trim()) {
      alert("Nama, email, dan password wajib diisi!");
      return;
    }
    try {
      const newUid = "u-" + Math.random().toString(36).substr(2, 9);
      const newProfile: UserProfile = {
        uid: newUid,
        name: selfRegName.trim(),
        email: selfRegEmail.trim().toLowerCase(),
        role: 'Pegawai',
        division: selfRegDivision,
        password: selfRegPassword.trim(),
        photoURL: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&q=80&w=150`,
        createdAt: new Date().toISOString()
      };

      await dbService.createUserProfile(newProfile);
      setSelfRegSuccess(true);
      setSelfRegName('');
      setSelfRegEmail('');
      setSelfRegPassword('');
      setSelfRegDivision('Asrama');
      setTimeout(() => {
        setSelfRegSuccess(false);
        setShowSelfReg(false);
      }, 3500);
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan registrasi mandiri.");
    }
  };

  // Routing navigation menu list
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard Analisis', icon: <LayoutDashboard className="w-4 h-4" />, role: 'Semua' },
    { id: 'buat-laporan', label: 'Buat Aduan', icon: <ClipboardPlus className="w-4 h-4" />, role: 'Semua' },
    { id: 'monitoring', label: 'Monitoring Master', icon: <Sliders className="w-4 h-4" />, role: 'GA_Admin' },
    { id: 'daftar-laporan', label: 'Daftar Laporan', icon: <ListFilter className="w-4 h-4" />, role: 'Semua' },
    { id: 'data-aset', label: 'Data Aset & QR', icon: <Tag className="w-4 h-4" />, role: 'Semua' },
    { id: 'sektor-lokasi', label: 'Kelola Sektor', icon: <MapPin className="w-4 h-4" />, role: 'Administrator' },
    { id: 'kategori-aduan', label: 'Kelola Kategori', icon: <Wrench className="w-4 h-4" />, role: 'Administrator' },
    { id: 'kelola-pengguna', label: 'Kelola Pengguna', icon: <Users className="w-4 h-4" />, role: 'Administrator' },
    { id: 'riwayat-pemeliharaan', label: 'Riwayat Selesai', icon: <Clock className="w-4 h-4" />, role: 'Semua' },
    { id: 'rekap-laporan', label: 'Cetak Laporan', icon: <FileSpreadsheet className="w-4 h-4" />, role: 'GA_Admin' },
    { id: 'pengaturan', label: 'Pengaturan Profil', icon: <Settings className="w-4 h-4" />, role: 'Semua' },
  ];

  // Helper to check user permission (supports checklist permissions & defaults)
  const checkUserPermission = (itemId: string): boolean => {
    if (!isAuthenticated) {
      return itemId === 'dashboard';
    }
    if (currentUser.permissions && currentUser.permissions[itemId] !== undefined) {
      return !!currentUser.permissions[itemId];
    }
    // Default fallback based on role
    if (itemId === 'dashboard' || itemId === 'buat-laporan' || itemId === 'daftar-laporan' || itemId === 'data-aset' || itemId === 'riwayat-pemeliharaan' || itemId === 'pengaturan') {
      return true;
    }
    if (itemId === 'monitoring' || itemId === 'rekap-laporan') {
      return currentUser.role === 'GA' || currentUser.role === 'Administrator';
    }
    if (itemId === 'sektor-lokasi' || itemId === 'kategori-aduan' || itemId === 'kelola-pengguna') {
      return currentUser.role === 'Administrator';
    }
    return false;
  };

  // Filter navigation items by current user permissions
  const filteredNavItems = NAV_ITEMS.filter(item => checkUserPermission(item.id));

  // Auto-redirect to first permitted tab if active tab becomes disallowed
  useEffect(() => {
    if (filteredNavItems.length > 0 && !filteredNavItems.some(item => item.id === activeTab)) {
      setActiveTab(filteredNavItems[0].id);
    }
  }, [activeTab, filteredNavItems]);

  // Render Sub views dynamically based on Active Tab State
  const renderSubView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            reports={reports} 
            assets={assets} 
            categories={categories}
            locations={locations}
            onViewTicket={(ticket) => setSelectedTicketCode(ticket)} 
            darkMode={darkMode}
            isGuest={!isAuthenticated}
            onLoginClick={() => setShowLoginGate(true)}
          />
        );
      case 'buat-laporan':
        return (
          <CreateReportView 
            currentUser={currentUser}
            locations={locations}
            categories={categories}
            assets={assets}
            prefilledAssetCode={prefilledAssetCode}
            onSubmit={handleCreateReport}
            onSuccessRedirect={() => {
              setPrefilledAssetCode('');
              setActiveTab('daftar-laporan');
            }}
          />
        );
      case 'monitoring':
        return (
          <MonitoringView 
            reports={reports} 
            userRole={currentUser.role}
            users={[]}
            onViewTicket={(ticket) => setSelectedTicketCode(ticket)} 
          />
        );
      case 'daftar-laporan':
        return (
          <ReportsListView 
            reports={reports} 
            onViewTicket={(ticket) => setSelectedTicketCode(ticket)} 
          />
        );
      case 'data-aset':
        return (
          <AssetsView 
            assets={assets} 
            reports={reports}
            locations={locations}
            categories={categories}
            currentUser={currentUser}
            onCreateAsset={handleCreateAsset}
            onUpdateAsset={handleUpdateAsset}
            onTriggerReportWithAsset={handleTriggerReportWithAsset}
          />
        );
      case 'sektor-lokasi':
        return (
          <LocationsView 
            locations={locations}
            currentUser={currentUser}
            onCreateLocation={handleCreateLocation}
            onDeleteLocation={handleDestroyLocation}
          />
        );
      case 'kategori-aduan':
        return (
          <CategoriesView 
            categories={categories}
            currentUser={currentUser}
            onCreateCategory={handleCreateCategory}
            onDeleteCategory={handleDestroyCategory}
          />
        );
      case 'riwayat-pemeliharaan':
        // Show ReportsListView but filter to only 'Selesai' and 'Ditolak'
        const resolvedReports = reports.filter(r => r.status === 'Selesai' || r.status === 'Ditolak');
        return (
          <ReportsListView 
            reports={resolvedReports} 
            onViewTicket={(ticket) => setSelectedTicketCode(ticket)} 
            titleText="Riwayat Pemeliharaan & Selesai"
            subtitleText="Daftar rekam histori aduan kerusakan yang telah diselesaikan atau ditolak oleh General Affair"
            defaultStatusFilter="Selesai"
          />
        );
      case 'rekap-laporan':
        return (
          <LaporanView reports={reports} />
        );
      case 'kelola-pengguna':
        return (
          <UserManagementView currentUser={currentUser} />
        );
      case 'pengaturan':
        return (
          <SettingsView 
            currentUser={currentUser}
            onChangeUserRole={handleChangeUserRole}
            onResetDatabase={handleResetDatabase}
            onBackupDatabase={handleBackupDatabase}
            onRestoreDatabase={handleRestoreDatabase}
            onClearReports={handleClearReports}
          />
        );
      default:
        return <div className="text-center py-20 text-slate-400">View dalam pengembangan</div>;
    }
  };

  // LANDING PAGE / LOGIN VIEW
  if (!isAuthenticated && showLoginGate) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background visual brand dots and accent */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-8 text-center relative z-10 animate-fade-in my-8">
          
          {/* Logo / Brand Header */}
          <div className="space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg text-white font-extrabold text-xl font-mono tracking-tight">
              SCB
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">SCB-CARE</h1>
              <p className="text-xs font-bold text-primary tracking-wide uppercase">Sekolah Cendekia BAZNAS</p>
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">Complaint & Asset Repair System</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light px-4">
            Aplikasi pelaporan kerusakan sarana prasarana sekolah terintegrasi dengan penunjukan PIC teknisi GA, scan QR Code instan, serta pemantauan waktu perbaikan secara real-time.
          </p>

          {showSelfReg ? (
            <form onSubmit={handleSelfRegister} className="space-y-4 text-left animate-fade-in">
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-2 border-b dark:border-slate-800">
                <UserPlus className="w-4.5 h-4.5 text-primary" />
                Registrasi Akun Mandiri (Pegawai)
              </h2>

              {selfRegSuccess ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 text-[11px] font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />
                  <span>Registrasi Berhasil! Anda sekarang dapat masuk.</span>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      value={selfRegName}
                      onChange={(e) => setSelfRegName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Akun (Google)</label>
                    <input
                      type="email"
                      placeholder="Contoh: nama@cendekia.sch.id"
                      value={selfRegEmail}
                      onChange={(e) => setSelfRegEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      placeholder="Buat password minimal 6 karakter"
                      value={selfRegPassword}
                      onChange={(e) => setSelfRegPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Divisi Pelapor</label>
                    <select
                      value={selfRegDivision}
                      onChange={(e) => setSelfRegDivision(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Asrama">Asrama</option>
                      <option value="Akademik">Akademik</option>
                      <option value="Operasional">Operasional</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowSelfReg(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl font-bold transition text-xs"
                    >
                      Batalkan
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold transition text-xs shadow-md"
                    >
                      Kirim Registrasi
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            <div className="space-y-5 pt-1 animate-fade-in">
              <form onSubmit={handleLoginWithCredentials} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Pengguna</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Masukkan email Anda"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Box */}
                {loginError && (
                  <div className="bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 text-[11px] font-medium text-left flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-600/95 rounded-xl font-bold text-white text-xs transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Masuk Aplikasi</span>
                  <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition" />
                </button>
              </form>

              <div className="pt-2 border-t dark:border-slate-800 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowSelfReg(true)}
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Belum terdaftar? Registrasi Akun Mandiri
                </button>
                
                <div className="relative flex py-1.5 items-center">
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-mono">ATAU</span>
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLoginGate(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                  <span>Kembali & Lihat Dashboard Analisis</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer inside login screen */}
          <div className="text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-50 dark:border-slate-800">
            SCB-CARE © {new Date().getFullYear()} • Sekolah Cendekia BAZNAS
          </div>

        </div>
      </div>
    );
  }

  // CORE APPLICATION LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-700 dark:text-slate-300">
      
      {/* 1. DESKTOP NAVIGATION SIDEBAR (Sticky Left, MD screens and up) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 sticky top-0 h-screen shrink-0 text-xs">
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0">
              SCB
            </div>
            <div className="truncate text-left">
              <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-0.5">SCB-CARE</h2>
              <span className="text-[9px] font-bold text-primary tracking-wide uppercase">Cendekia BAZNAS</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition shrink-0"
            title={darkMode ? "Mode Terang" : "Mode Gelap"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto pr-2">
          {filteredNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition text-left ${activeTab === item.id ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Logged-in User Profile Indicator */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2.5 truncate">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="pfp" className="w-8.5 h-8.5 rounded-full object-cover shrink-0 border" />
                ) : (
                  <div className="w-8.5 h-8.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{currentUser.name[0]}</div>
                )}
                <div className="truncate text-[11px]">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate leading-none mb-1">{currentUser.name}</p>
                  <span className="text-[8px] bg-primary/15 text-primary dark:bg-primary/20 px-1.5 py-0.2 rounded font-black uppercase tracking-wide">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-1.5 border border-slate-200 dark:border-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 rounded-lg font-bold text-slate-500 dark:text-slate-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8.5 h-8.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate text-[11px]">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate leading-none mb-1">Pengunjung Anonim</p>
                  <span className="text-[8px] bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.2 rounded font-black uppercase tracking-wide">
                    Belum Terdaftar
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowLoginGate(true)}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Masuk / Registrasi</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* 2. MOBILE NAVIGATION DRAWERS (Slideout Overlay, MD screens and below) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm flex">
          <div className="w-64 bg-white dark:bg-slate-900 h-full flex flex-col justify-between border-r text-xs p-5 animate-slide-in relative">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 text-left">
              {/* Brand logo */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-xs">SCB</div>
                  <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white">SCB-CARE</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1 overflow-y-auto max-h-[70vh]">
                {filteredNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition text-left ${activeTab === item.id ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Profile */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <img src={currentUser.photoURL} alt="pfp" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-none mb-1 truncate max-w-[130px]">{currentUser.name}</p>
                      <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-black uppercase">{currentUser.role}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-none mb-1 truncate max-w-[130px]">Pengunjung Anonim</p>
                      <span className="text-[8px] bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.2 rounded font-black uppercase">Belum Terdaftar</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLoginGate(true);
                    }}
                    className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Masuk / Registrasi</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header Toolbar Bar (Shown on MD screens and below) */}
        <header className="md:hidden flex justify-between items-center bg-white dark:bg-slate-900 px-5 py-3.5 border-b sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <span className="font-black text-sm tracking-tight text-primary">SCB-CARE</span>
          </div>

          {isAuthenticated ? (
            <span className="text-[9px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full uppercase">
              {currentUser.role}
            </span>
          ) : (
            <button
              onClick={() => setShowLoginGate(true)}
              className="text-[10px] bg-primary text-white font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserCheck className="w-3 h-3" />
              <span>Masuk</span>
            </button>
          )}
        </header>

        {/* Dynamic Inner views window wrapper */}
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-semibold text-slate-400">Menghubungkan data SCB-CARE...</span>
            </div>
          ) : (
            renderSubView()
          )}
        </main>
      </div>

      {/* 4. MODAL DETAILED COMPLAINT INSPECTOR PANEL */}
      {activeInspectReport && (
        <ReportDetailModal
          report={activeInspectReport}
          currentUser={currentUser}
          onClose={() => setSelectedTicketCode(null)}
          onUpdateReport={handleUpdateReport}
          onDeleteReport={currentUser.role === 'Administrator' ? handleDeleteReport : undefined}
        />
      )}

    </div>
  );
}
