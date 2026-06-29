import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  limit, 
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db, databaseId } from "./firebase";
import { Report, Asset, Location, Category, UserProfile, Comment, TimelineEvent, UserRole } from "./types";

// Local Storage Fallback Keys
const STORAGE_KEYS = {
  REPORTS: "scb_care_reports",
  ASSETS: "scb_care_assets",
  LOCATIONS: "scb_care_locations",
  CATEGORIES: "scb_care_categories",
  USERS: "scb_care_users"
};

// Check if Firebase is available
const isFirebaseAvailable = () => {
  return db !== null;
};

// --- INITIAL SEED DATA ---
const SEED_CATEGORIES: Category[] = [
  { name: "Bangunan", icon: "Home", color: "bg-emerald-500", createdAt: new Date().toISOString() },
  { name: "Listrik", icon: "Zap", color: "bg-yellow-500", createdAt: new Date().toISOString() },
  { name: "Air & Sanitasi", icon: "Droplet", color: "bg-blue-500", createdAt: new Date().toISOString() },
  { name: "Pintu & Jendela", icon: "Hammer", color: "bg-amber-600", createdAt: new Date().toISOString() },
  { name: "Atap & Plafon", icon: "Umbrella", color: "bg-sky-400", createdAt: new Date().toISOString() },
  { name: "Lantai & Dinding", icon: "Box", color: "bg-slate-500", createdAt: new Date().toISOString() },
  { name: "Furniture", icon: "Briefcase", color: "bg-teal-500", createdAt: new Date().toISOString() },
  { name: "Peralatan Elektronik", icon: "Tv", color: "bg-indigo-500", createdAt: new Date().toISOString() },
  { name: "Komputer & Laptop", icon: "Cpu", color: "bg-purple-500", createdAt: new Date().toISOString() },
  { name: "Jaringan Internet", icon: "Wifi", color: "bg-rose-500", createdAt: new Date().toISOString() },
  { name: "Proyektor & Multimedia", icon: "Video", color: "bg-cyan-600", createdAt: new Date().toISOString() },
  { name: "AC & Ventilasi", icon: "Wind", color: "bg-sky-400", createdAt: new Date().toISOString() },
  { name: "CCTV & Keamanan", icon: "Shield", color: "bg-pink-500", createdAt: new Date().toISOString() },
  { name: "Akses Kontrol & Kunci", icon: "Settings", color: "bg-slate-500", createdAt: new Date().toISOString() },
  { name: "Peralatan Laboratorium", icon: "FlaskConical", color: "bg-teal-500", createdAt: new Date().toISOString() },
  { name: "Peralatan Olahraga", icon: "Sparkles", color: "bg-emerald-500", createdAt: new Date().toISOString() },
  { name: "Peralatan Ibadah", icon: "Compass", color: "bg-yellow-500", createdAt: new Date().toISOString() },
  { name: "Kendaraan Operasional", icon: "Car", color: "bg-blue-500", createdAt: new Date().toISOString() },
  { name: "Taman & Lanskap", icon: "Compass", color: "bg-emerald-500", createdAt: new Date().toISOString() },
  { name: "Drainase", icon: "Droplet", color: "bg-cyan-600", createdAt: new Date().toISOString() },
  { name: "Kebersihan", icon: "Sparkles", color: "bg-slate-500", createdAt: new Date().toISOString() },
  { name: "APAR", icon: "Shield", color: "bg-rose-500", createdAt: new Date().toISOString() },
  { name: "Genset", icon: "Zap", color: "bg-amber-600", createdAt: new Date().toISOString() }
];

const SEED_LOCATIONS: Location[] = [
  { name: "Gedung Kelas Putra", building: "Akademik", createdAt: new Date().toISOString() },
  { name: "Lab Kom", building: "Laboratorium", createdAt: new Date().toISOString() },
  { name: "Perpustakaan", building: "Akademik", createdAt: new Date().toISOString() },
  { name: "UKS", building: "Akademik", createdAt: new Date().toISOString() },
  { name: "Kantor Utama", building: "Utama", createdAt: new Date().toISOString() },
  { name: "Kantor OP", building: "Utama", createdAt: new Date().toISOString() },
  { name: "Koperasi", building: "Serbaguna", createdAt: new Date().toISOString() },
  { name: "Asrama Putra", building: "Asrama", createdAt: new Date().toISOString() },
  { name: "Masjid Putra", building: "Ibadah", createdAt: new Date().toISOString() },
  { name: "Rumah Pembina Putra", building: "Asrama", createdAt: new Date().toISOString() },
  { name: "Pos 1", building: "Outdoor", createdAt: new Date().toISOString() },
  { name: "Pos 2", building: "Outdoor", createdAt: new Date().toISOString() },
  { name: "Kelas Putri", building: "Akademik", createdAt: new Date().toISOString() },
  { name: "Masjid Putri", building: "Ibadah", createdAt: new Date().toISOString() },
  { name: "Asrama Putri", building: "Asrama", createdAt: new Date().toISOString() },
  { name: "Rumah Pembina Putri", building: "Asrama", createdAt: new Date().toISOString() }
];

const SEED_ASSETS: Asset[] = [
  {
    assetCode: "AST-001",
    assetName: "AC Split Daikin 1.5 PK",
    category: "AC & Ventilasi",
    location: "Gedung Kelas Putra",
    building: "Akademik",
    floor: "Lantai 2",
    room: "Ruang Kelas 10A",
    brand: "Daikin",
    model: "FTKC35TVM4",
    serialNumber: "DK9823102",
    purchaseDate: "2024-03-12",
    assetValue: 7500000,
    condition: "Baik",
    maintenanceHistory: [
      { date: "2025-06-15", type: "Cuci AC", description: "Pembersihan rutin dan tambah freon", cost: 150000, performedBy: "Indo Teknik" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-002",
    assetName: "Proyektor Epson EB-X400",
    category: "Proyektor & Multimedia",
    location: "Koperasi",
    building: "Serbaguna",
    floor: "Lantai 1",
    room: "Panggung Utama",
    brand: "Epson",
    model: "EB-X400",
    serialNumber: "EPS-908123",
    purchaseDate: "2023-11-20",
    assetValue: 5800000,
    condition: "Rusak Ringan",
    maintenanceHistory: [
      { date: "2025-12-01", type: "Ganti Lampu", description: "Penggantian modul lampu proyektor", cost: 1200000, performedBy: "Mitra Visual" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-003",
    assetName: "Router Mikrotik CCR1009",
    category: "Jaringan Internet",
    location: "Kantor Utama",
    building: "Utama",
    floor: "Lantai 1",
    room: "Server Room",
    brand: "Mikrotik",
    model: "CCR1009-7G-1C-1S+",
    serialNumber: "MT90823412",
    purchaseDate: "2022-08-10",
    assetValue: 9500000,
    condition: "Baik",
    maintenanceHistory: [],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-004",
    assetName: "CCTV Dome Hikvision 4MP",
    category: "CCTV & Keamanan",
    location: "Asrama Putra",
    building: "Asrama",
    floor: "Lantai 1",
    room: "Koridor Depan",
    brand: "Hikvision",
    model: "DS-2CD2143G0-I",
    serialNumber: "HK-8230912",
    purchaseDate: "2024-01-15",
    assetValue: 1200000,
    condition: "Baik",
    maintenanceHistory: [],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-005",
    assetName: "Pompa Air Shimizu JET-400",
    category: "Air & Sanitasi",
    location: "Masjid Putra",
    building: "Ibadah",
    floor: "Lantai 1",
    room: "Ruang Mesin Air",
    brand: "Shimizu",
    model: "JET-400 BIT",
    serialNumber: "SZ-012394",
    purchaseDate: "2023-05-04",
    assetValue: 3500000,
    condition: "Rusak Berat",
    maintenanceHistory: [
      { date: "2025-02-14", type: "Ganti Kapasitor", description: "Perbaikan motor macet", cost: 350000, performedBy: "Sinar Pompa" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-006",
    assetName: "Meja Belajar Kayu Jati",
    category: "Furniture",
    location: "Asrama Putra",
    building: "Asrama",
    floor: "Lantai 2",
    room: "Kamar 1",
    brand: "Lokal Mandiri",
    model: "M-Belajar-24",
    serialNumber: "FUR-00812",
    purchaseDate: "2025-01-10",
    assetValue: 1200000,
    condition: "Baik",
    maintenanceHistory: [],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-007",
    assetName: "Laptop Lenovo ThinkPad L14",
    category: "Komputer & Laptop",
    location: "Kantor Utama",
    building: "Utama",
    floor: "Lantai 1",
    room: "Ruang Keuangan",
    brand: "Lenovo",
    model: "ThinkPad L14 Gen 2",
    serialNumber: "LNV-890213",
    purchaseDate: "2024-05-18",
    assetValue: 14500000,
    condition: "Baik",
    maintenanceHistory: [],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-008",
    assetName: "Genset Silent Honda 10kVA",
    category: "Genset",
    location: "Pos 1",
    building: "Outdoor",
    floor: "Lantai 1",
    room: "Rumah Genset",
    brand: "Honda",
    model: "EXT-12D00",
    serialNumber: "HND-76812",
    purchaseDate: "2023-09-01",
    assetValue: 48000000,
    condition: "Baik",
    maintenanceHistory: [
      { date: "2025-10-10", type: "Ganti Oli & Filter", description: "Servis berkkala 100 jam kerja", cost: 1200000, performedBy: "Genset Center" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-009",
    assetName: "Printer HP LaserJet M404dn",
    category: "Peralatan Elektronik",
    location: "Perpustakaan",
    building: "Akademik",
    floor: "Lantai 1",
    room: "Meja Petugas",
    brand: "HP",
    model: "M404dn",
    serialNumber: "HPLJ-89102",
    purchaseDate: "2024-08-25",
    assetValue: 4500000,
    condition: "Baik",
    maintenanceHistory: [],
    createdAt: new Date().toISOString()
  },
  {
    assetCode: "AST-010",
    assetName: "Mikroskop Binokuler Olympus",
    category: "Peralatan Laboratorium",
    location: "Lab Kom",
    building: "Laboratorium",
    floor: "Lantai 1",
    room: "Ruang Preparat",
    brand: "Olympus",
    model: "CX23",
    serialNumber: "OLY-90812",
    purchaseDate: "2023-02-15",
    assetValue: 18500000,
    condition: "Rusak Ringan",
    maintenanceHistory: [],
    createdAt: new Date().toISOString()
  }
];

// Seed some reports from the last 6 months (Jan to Jun 2026) to make beautiful stats
const generateHistoricalReports = (): Report[] => {
  const reports: Report[] = [
    {
      ticketNumber: "SCB-2026-000001",
      reporter: "Ahmad Syaifuddin",
      email: "ahmad.s@cendekiabaznas.sch.id",
      division: "Kesiswaan",
      location: "Asrama Putra",
      building: "Asrama",
      floor: "Lantai 2",
      room: "Kamar 4",
      category: "Furniture",
      assetCode: "AST-006",
      assetName: "Meja Belajar Kayu Jati",
      title: "Laci meja patah",
      description: "Laci sebelah kanan meja belajar lepas dari relnya dan papan kayunya retak.",
      priority: "Rendah",
      status: "Selesai",
      assignedTo: "Budi (Teknisi Sarpras)",
      estimateFinish: "2026-01-15",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-01-08T08:30:00Z", status: "Menunggu", note: "Laporan dibuat oleh Ahmad Syaifuddin", updatedBy: "Ahmad Syaifuddin" },
        { id: "2", time: "2026-01-08T10:00:00Z", status: "Diverifikasi", note: "Terverifikasi oleh GA, diteruskan ke Sarpras", updatedBy: "GA Admin" },
        { id: "3", time: "2026-01-09T09:00:00Z", status: "Diproses", note: "Diproses oleh Budi (Teknisi)", updatedBy: "Budi (Teknisi Sarpras)" },
        { id: "4", time: "2026-01-11T14:30:00Z", status: "Selesai", note: "Rel diganti baru dan retakan dilem kuat. Selesai.", updatedBy: "Budi (Teknisi Sarpras)" }
      ],
      comments: [
        { id: "c1", userName: "Ahmad Syaifuddin", userEmail: "ahmad.s@cendekiabaznas.sch.id", userRole: "Pegawai", commentText: "Mohon segera diperbaiki agar santri bisa belajar dengan nyaman kembali.", createdAt: "2026-01-08T08:32:00Z" },
        { id: "c2", userName: "Budi (Teknisi)", userEmail: "budi@cendekiabaznas.sch.id", userRole: "GA", commentText: "Siap, masuk antrean pengerjaan besok pagi.", createdAt: "2026-01-08T11:00:00Z" }
      ],
      createdAt: "2026-01-08T08:30:00Z",
      updatedAt: "2026-01-11T14:30:00Z",
      slaMet: true
    },
    {
      ticketNumber: "SCB-2026-000002",
      reporter: "Siti Fatimah",
      email: "siti.f@cendekiabaznas.sch.id",
      division: "Sarpras",
      location: "Gedung Kelas Putra",
      building: "Akademik",
      floor: "Lantai 2",
      room: "Ruang Kelas 10A",
      category: "AC & Ventilasi",
      assetCode: "AST-001",
      assetName: "AC Split Daikin 1.5 PK",
      title: "AC tidak dingin dan mengeluarkan air",
      description: "AC menyala tetapi hanya keluar angin seperti kipas angin biasa, dan ada air yang menetes dari indoor unit ke arah lantai kelas.",
      priority: "Sedang",
      status: "Selesai",
      assignedTo: "Hendy (AC Spesialis)",
      estimateFinish: "2026-02-18",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-02-15T09:15:00Z", status: "Menunggu", note: "Laporan dibuat oleh Siti Fatimah", updatedBy: "Siti Fatimah" },
        { id: "2", time: "2026-02-15T14:00:00Z", status: "Diverifikasi", note: "Laporan terverifikasi. Butuh cuci AC & pembersihan saluran pembuangan.", updatedBy: "GA Admin" },
        { id: "3", time: "2026-02-16T10:00:00Z", status: "Diproses", note: "Teknisi sudah di lokasi membongkar casing AC.", updatedBy: "Hendy (AC Spesialis)" },
        { id: "4", time: "2026-02-16T11:45:00Z", status: "Selesai", note: "Saluran pembuangan tersumbat lumut sudah dibersihkan. AC dicuci bersih and dingin kembali.", updatedBy: "Hendy (AC Spesialis)" }
      ],
      comments: [],
      createdAt: "2026-02-15T09:15:00Z",
      updatedAt: "2026-02-16T11:45:00Z",
      slaMet: true // Sedang SLA is 3 days. Finished in ~1 day.
    },
    {
      ticketNumber: "SCB-2026-000003",
      reporter: "Yusuf Habibi",
      email: "yusuf.h@cendekiabaznas.sch.id",
      division: "GA",
      location: "Masjid Putra",
      building: "Ibadah",
      floor: "Lantai 1",
      room: "Ruang Mesin Air",
      category: "Air & Sanitasi",
      assetCode: "AST-005",
      assetName: "Pompa Air Shimizu JET-400",
      title: "Pompa Air Masjid Terbakar",
      description: "Mesin pompa mengeluarkan asap tebal dan bau terbakar saat dihidupkan. Air wudhu masjid mati total.",
      priority: "Darurat",
      status: "Diproses",
      assignedTo: "Budi (Teknisi Sarpras)",
      estimateFinish: "2026-06-28",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-06-27T05:00:00Z", status: "Menunggu", note: "Laporan dibuat otomatis/staf karena darurat air masjid.", updatedBy: "Yusuf Habibi" },
        { id: "2", time: "2026-06-27T05:15:00Z", status: "Diverifikasi", note: "Diverifikasi Darurat oleh GA. Butuh penggantian motor pompa air.", updatedBy: "GA Admin" },
        { id: "3", time: "2026-06-27T05:30:00Z", status: "Diproses", note: "Sedang dikoordinasikan pembelian pompa cadangan.", updatedBy: "Budi (Teknisi Sarpras)" }
      ],
      comments: [
        { id: "c3", userName: "Admin GA", userEmail: "operasional.scb@gmail.com", userRole: "GA", commentText: "Ini kritis untuk ibadah santri. Segera koordinasi pinjam pompa cadangan atau beli baru hari ini.", createdAt: "2026-06-27T05:20:00Z" }
      ],
      createdAt: "2026-06-27T05:00:00Z",
      updatedAt: "2026-06-27T05:30:00Z"
    },
    {
      ticketNumber: "SCB-2026-000004",
      reporter: "Nur Hidayat",
      email: "nur.h@cendekiabaznas.sch.id",
      division: "Kurikulum",
      location: "Lab Kom",
      building: "Laboratorium",
      floor: "Lantai 1",
      room: "Lab Utama",
      category: "Jaringan Internet",
      assetCode: "AST-003",
      assetName: "Router Mikrotik CCR1009",
      title: "Koneksi Wifi Lab Komputer Sering RTO",
      description: "Koneksi internet tidak stabil, sering Request Time Out (RTO) ketika digunakan santri untuk praktik coding.",
      priority: "Tinggi",
      status: "Menunggu Sparepart",
      assignedTo: "Fajar (IT Support)",
      estimateFinish: "2026-04-10",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-04-01T09:00:00Z", status: "Menunggu", note: "Laporan dibuat oleh Nur Hidayat", updatedBy: "Nur Hidayat" },
        { id: "2", time: "2026-04-01T11:00:00Z", status: "Diverifikasi", note: "Diverifikasi oleh IT team, port SFP router bermasalah", updatedBy: "GA Admin" },
        { id: "3", time: "2026-04-02T13:00:00Z", status: "Diproses", note: "Pengecekan hardware, butuh penggantian modul SFP transciever", updatedBy: "Fajar (IT Support)" },
        { id: "4", time: "2026-04-03T10:00:00Z", status: "Menunggu Sparepart", note: "Menunggu kiriman modul SFP dari supplier di Jakarta", updatedBy: "Fajar (IT Support)" }
      ],
      comments: [
        { id: "c4", userName: "Nur Hidayat", userEmail: "nur.h@cendekiabaznas.sch.id", userRole: "Pegawai", commentText: "Apakah modulnya sudah sampai? Pekan depan ada ujian sertifikasi santri.", createdAt: "2026-04-05T08:00:00Z" }
      ],
      createdAt: "2026-04-01T09:00:00Z",
      updatedAt: "2026-04-03T10:00:00Z"
    },
    {
      ticketNumber: "SCB-2026-000005",
      reporter: "Humas SCB",
      email: "humas@cendekiabaznas.sch.id",
      division: "Humas",
      location: "Koperasi",
      building: "Serbaguna",
      floor: "Lantai 1",
      room: "Panggung Utama",
      category: "Proyektor & Multimedia",
      assetCode: "AST-002",
      assetName: "Proyektor Epson EB-X400",
      title: "Lampu Proyektor Mati Total",
      description: "Saat dihidupkan, kipas proyektor berputar kencang dan indikator Lamp menyala merah. Gambar tidak keluar.",
      priority: "Sedang",
      status: "Selesai",
      assignedTo: "Fajar (IT Support)",
      estimateFinish: "2026-03-12",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-03-08T10:00:00Z", status: "Menunggu", note: "Laporan dibuat oleh Humas SCB", updatedBy: "Humas SCB" },
        { id: "2", time: "2026-03-08T15:00:00Z", status: "Diverifikasi", note: "Lampu proyektor mencapai batas maksimal jam tayang. Perlu ganti modul lampu.", updatedBy: "GA Admin" },
        { id: "3", time: "2026-03-10T10:00:00Z", status: "Diproses", note: "Memasang modul lampu baru", updatedBy: "Fajar (IT Support)" },
        { id: "4", time: "2026-03-11T16:00:00Z", status: "Selesai", note: "Lampu diganti, proyektor kembali terang dan dikalibrasi warnanya.", updatedBy: "Fajar (IT Support)" }
      ],
      comments: [],
      createdAt: "2026-03-08T10:00:00Z",
      updatedAt: "2026-03-11T16:00:00Z",
      slaMet: true // Sedang limit is 3 days. Done in 3 days.
    },
    {
      ticketNumber: "SCB-2026-000006",
      reporter: "Ahmad Syaifuddin",
      email: "ahmad.s@cendekiabaznas.sch.id",
      division: "Kesiswaan",
      location: "Asrama Putra",
      building: "Asrama",
      floor: "Lantai 1",
      room: "Kamar Mandi 3",
      category: "Air & Sanitasi",
      assetCode: "AST-005",
      assetName: "Pompa Air Shimizu JET-400",
      title: "Kran air patah di kamar mandi santri",
      description: "Salah satu kran air plastik patah di dalam drat dinding kamar mandi asrama putra lantai 1.",
      priority: "Tinggi",
      status: "Selesai",
      assignedTo: "Budi (Teknisi Sarpras)",
      estimateFinish: "2026-05-13",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-05-12T06:00:00Z", status: "Menunggu", note: "Laporan masuk", updatedBy: "Ahmad Syaifuddin" },
        { id: "2", time: "2026-05-12T07:10:00Z", status: "Diverifikasi", note: "Disetujui untuk perbaikan langsung", updatedBy: "GA Admin" },
        { id: "3", time: "2026-05-12T08:00:00Z", status: "Diproses", note: "Teknisi mencabut drat patah di dinding", updatedBy: "Budi (Teknisi Sarpras)" },
        { id: "4", time: "2026-05-12T09:00:00Z", status: "Selesai", note: "Drat berhasil dikeluarkan, kran diganti besi stainless yang lebih kuat.", updatedBy: "Budi (Teknisi Sarpras)" }
      ],
      comments: [],
      createdAt: "2026-05-12T06:00:00Z",
      updatedAt: "2026-05-12T09:00:00Z",
      slaMet: true // Tinggi limit is 1 day. Done in 3 hours.
    },
    {
      ticketNumber: "SCB-2026-000007",
      reporter: "Rina Kartika",
      email: "rina.k@cendekiabaznas.sch.id",
      division: "Keuangan",
      location: "Kantor Utama",
      building: "Utama",
      floor: "Lantai 1",
      room: "Ruang Keuangan",
      category: "Listrik",
      assetCode: "AST-008",
      assetName: "Genset Silent Honda 10kVA",
      title: "MCB Ruangan Keuangan sering Jeglek",
      description: "Setiap menyalakan printer laserjet dan AC bersamaan di ruang keuangan, MCB listrik langsung turun (jeglek).",
      priority: "Tinggi",
      status: "Selesai",
      assignedTo: "Slamet (Kelistrikan)",
      estimateFinish: "2026-05-16",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-05-15T08:00:00Z", status: "Menunggu", note: "Laporan masuk", updatedBy: "Rina Kartika" },
        { id: "2", time: "2026-05-15T09:30:00Z", status: "Diverifikasi", note: "Diduga beban tidak seimbang pada pembagian phase MCB.", updatedBy: "GA Admin" },
        { id: "3", time: "2026-05-15T11:00:00Z", status: "Diproses", note: "Pengukuran arus dan pembagian ulang fasa panel listrik ruang keuangan.", updatedBy: "Slamet (Kelistrikan)" },
        { id: "4", time: "2026-05-15T14:00:00Z", status: "Selesai", note: "Phase MCB ditata ulang agar seimbang. Printer dan AC kini bisa menyala bersamaan.", updatedBy: "Slamet (Kelistrikan)" }
      ],
      comments: [],
      createdAt: "2026-05-15T08:00:00Z",
      updatedAt: "2026-05-15T14:00:00Z",
      slaMet: true // Tinggi limit is 1 day. Done in 6 hours.
    },
    {
      ticketNumber: "SCB-2026-000008",
      reporter: "Siti Fatimah",
      email: "siti.f@cendekiabaznas.sch.id",
      division: "Sarpras",
      location: "Asrama Putri",
      building: "Asrama",
      floor: "Lantai 1",
      room: "Koridor Asrama Putri",
      category: "CCTV & Keamanan",
      assetCode: "AST-004",
      assetName: "CCTV Dome Hikvision 4MP",
      title: "Gambar CCTV Koridor Asrama Putri Blur",
      description: "Tampilan di monitor DVR untuk kamera koridor asrama putri sangat buram dan berkabut, tidak terlihat jelas.",
      priority: "Sedang",
      status: "Selesai",
      assignedTo: "Fajar (IT Support)",
      estimateFinish: "2026-06-12",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-06-10T11:00:00Z", status: "Menunggu", note: "Laporan masuk", updatedBy: "Siti Fatimah" },
        { id: "2", time: "2026-06-10T13:00:00Z", status: "Diverifikasi", note: "Diduga lensa luar berdebu atau berembun.", updatedBy: "GA Admin" },
        { id: "3", time: "2026-06-11T09:00:00Z", status: "Diproses", note: "Lensa luar dibersihkan and diposisikan ulang.", updatedBy: "Fajar (IT Support)" },
        { id: "4", time: "2026-06-11T10:30:00Z", status: "Selesai", note: "Lensa dibersihkan dari sarang laba-laba dan debu tebal. Gambar kembali jernih.", updatedBy: "Fajar (IT Support)" }
      ],
      comments: [],
      createdAt: "2026-06-10T11:00:00Z",
      updatedAt: "2026-06-11T10:30:00Z",
      slaMet: true
    },
    {
      ticketNumber: "SCB-2026-000009",
      reporter: "Yusuf Habibi",
      email: "yusuf.h@cendekiabaznas.sch.id",
      division: "GA",
      location: "Pos 1",
      building: "Outdoor",
      floor: "Lantai 1",
      room: "Rumah Genset",
      category: "Genset",
      assetCode: "AST-008",
      assetName: "Genset Silent Honda 10kVA",
      title: "Genset tidak bisa di-stater elektrik",
      description: "Saat listrik padam kemarin, genset silent tidak bisa di-stater elektrik dari panel ATS. Harus ditarik manual berulang kali baru menyala.",
      priority: "Tinggi",
      status: "Ditolak",
      assignedTo: "",
      estimateFinish: "",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-06-15T03:00:00Z", status: "Menunggu", note: "Laporan masuk", updatedBy: "Yusuf Habibi" },
        { id: "2", time: "2026-06-15T06:00:00Z", status: "Ditolak", note: "Laporan ditolak. Ini dikarenakan aki genset sudah dalam jadwal penggantian berkala yang telah disetujui di tiket pemeliharaan preventif Sarpras.", updatedBy: "GA Admin" }
      ],
      comments: [],
      createdAt: "2026-06-15T03:00:00Z",
      updatedAt: "2026-06-15T06:00:00Z"
    },
    {
      ticketNumber: "SCB-2026-000010",
      reporter: "Rina Kartika",
      email: "rina.k@cendekiabaznas.sch.id",
      division: "Keuangan",
      location: "Kantor Utama",
      building: "Utama",
      floor: "Lantai 1",
      room: "Lobby Utama",
      category: "Atap & Plafon",
      assetCode: "AST-007",
      assetName: "Laptop Lenovo ThinkPad L14",
      title: "Atap Lobby Bocor saat Hujan Deras",
      description: "Terdapat rembesan air cukup besar di atap plafon gypsum lobby utama, air menetes membasahi sofa penerima tamu.",
      priority: "Sedang",
      status: "Menunggu",
      assignedTo: "",
      estimateFinish: "",
      beforePhotos: [],
      afterPhotos: [],
      timeline: [
        { id: "1", time: "2026-06-26T14:00:00Z", status: "Menunggu", note: "Laporan dibuat oleh Rina Kartika", updatedBy: "Rina Kartika" }
      ],
      comments: [],
      createdAt: "2026-06-26T14:00:00Z",
      updatedAt: "2026-06-26T14:00:00Z"
    }
  ];
  return reports;
};

// Seed database on startup if empty
export const ensureDatabaseSeeded = async () => {
  try {
    const localLocs = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    const isLocalLocsEmpty = !localLocs || JSON.parse(localLocs).length === 0;
    const isLocalEmpty = localStorage.getItem("scb_db_seeded") !== "true" || isLocalLocsEmpty;
    
    // Process Categories & Locations
    let categoryCount = 0;
    let locationCount = 0;
    if (isFirebaseAvailable()) {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        categoryCount = catSnap.size;
        const locSnap = await getDocs(collection(db, "locations"));
        locationCount = locSnap.size;
      } catch (e) {
        console.warn("Firestore count check failed, using local seed", e);
      }
    } else {
      const localCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      categoryCount = localCats ? JSON.parse(localCats).length : 0;
      locationCount = localLocs ? JSON.parse(localLocs).length : 0;
    }

    if (categoryCount === 0 || locationCount === 0 || isLocalEmpty) {
      console.log("Database empty or not seeded. Seeding with high quality initial data...");
      
      // Save categories
      if (isFirebaseAvailable()) {
        try {
          const catCol = collection(db, "categories");
          for (const cat of SEED_CATEGORIES) {
            await addDoc(catCol, cat);
          }
        } catch (e) {
          console.error("Failed to seed categories to Firestore:", e);
        }
      }
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));

      // Save locations
      if (isFirebaseAvailable()) {
        try {
          const locCol = collection(db, "locations");
          for (const loc of SEED_LOCATIONS) {
            await addDoc(locCol, loc);
          }
        } catch (e) {
          console.error("Failed to seed locations to Firestore:", e);
        }
      }
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(SEED_LOCATIONS));

      // Save assets
      if (isFirebaseAvailable()) {
        try {
          const astCol = collection(db, "assets");
          for (const ast of SEED_ASSETS) {
            await addDoc(astCol, ast);
          }
        } catch (e) {
          console.error("Failed to seed assets to Firestore:", e);
        }
      }
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(SEED_ASSETS));

      // Save reports
      const seedReports: Report[] = [];
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(seedReports));

      // Seed default user profiles in local
      const seedUsers: UserProfile[] = [
        {
          uid: "demo-admin",
          name: "Administrator SCB",
          email: "operasional.scb@gmail.com",
          role: "Administrator",
          division: "GA",
          photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          createdAt: new Date().toISOString()
        },
        {
          uid: "demo-ga",
          name: "Yusuf Habibi (GA)",
          email: "ga.scb@gmail.com",
          role: "GA",
          division: "GA",
          photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
          createdAt: new Date().toISOString()
        },
        {
          uid: "demo-pegawai",
          name: "Ahmad Syaifuddin",
          email: "pegawai.scb@gmail.com",
          role: "Pegawai",
          division: "Kesiswaan",
          photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
          createdAt: new Date().toISOString()
        }
      ];

      if (isFirebaseAvailable()) {
        try {
          const usrCol = collection(db, "users");
          for (const usr of seedUsers) {
            // Use specific setDoc for static demo accounts
            await setDoc(doc(usrCol, usr.uid), usr);
          }
        } catch (e) {
          console.error("Failed to seed users to Firestore:", e);
        }
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
      
      localStorage.setItem("scb_db_seeded", "true");
      console.log("Database Seeding Completed Successfully.");
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
};

export const purgeDemoReports = async (): Promise<void> => {
  try {
    if (isFirebaseAvailable()) {
      const repCol = collection(db, "reports");
      const snap = await getDocs(repCol);
      const demoReporters = ["Ahmad Syaifuddin", "Siti Fatimah", "Yusuf Habibi", "Nur Hidayat", "Humas SCB", "Rina Kartika"];
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as Report;
        if (!data.reporter || demoReporters.includes(data.reporter) || docSnap.id.startsWith("demo-")) {
          await deleteDoc(doc(db, "reports", docSnap.id));
        }
      }
    }
    
    const local = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (local) {
      const reports = JSON.parse(local) as Report[];
      const demoReporters = ["Ahmad Syaifuddin", "Siti Fatimah", "Yusuf Habibi", "Nur Hidayat", "Humas SCB", "Rina Kartika"];
      const filtered = reports.filter(r => r.reporter && !demoReporters.includes(r.reporter));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
    } else {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    }
    
    localStorage.setItem("scb_demo_reports_purged", "true");
    console.log("Demo reports purged successfully.");
  } catch (e) {
    console.error("Failed to purge demo reports:", e);
  }
};

// --- DATA ACCESS OPERATIONS WITH LOCALSTORAGE BACKUP ---

// Generates modern Ticket Numbers: SCB-2026-000001
export const generateTicketNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  let maxNum = 0;
  
  try {
    const reports = await getReports();
    reports.forEach(r => {
      // Format is SCB-YYYY-NNNNNN
      if (r.ticketNumber && r.ticketNumber.startsWith(`SCB-${currentYear}-`)) {
        const suffixStr = r.ticketNumber.split("-")[2];
        const num = parseInt(suffixStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  } catch (e) {
    console.error("Error generating ticket number, using random counter", e);
  }
  
  const nextNumStr = String(maxNum + 1).padStart(6, "0");
  return `SCB-${currentYear}-${nextNumStr}`;
};

// 1. REPORTS SERVICE
export const getReports = async (): Promise<Report[]> => {
  if (isFirebaseAvailable()) {
    try {
      const snap = await getDocs(collection(db, "reports"));
      const list: Report[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Report);
      });
      // Sort by createdAt desc
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Update local storage for sync
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
      return list;
    } catch (e) {
      console.warn("Firestore getReports failed, falling back to localStorage", e);
    }
  }
  
  const local = localStorage.getItem(STORAGE_KEYS.REPORTS);
  const list = local ? JSON.parse(local) : [];
  list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
};

export const createReport = async (report: Omit<Report, "ticketNumber">): Promise<Report> => {
  const ticketNumber = await generateTicketNumber();
  const fullReport: Report = {
    ...report,
    ticketNumber,
    beforePhotos: report.beforePhotos || [],
    afterPhotos: report.afterPhotos || [],
    timeline: report.timeline || [
      {
        id: "1",
        time: new Date().toISOString(),
        status: "Menunggu",
        note: `Laporan baru dibuat dengan tiket ${ticketNumber}`,
        updatedBy: report.reporter
      }
    ],
    comments: report.comments || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseAvailable()) {
    try {
      const docRef = await addDoc(collection(db, "reports"), fullReport);
      fullReport.id = docRef.id;
      
      // Update local cache
      const currentReports = await getReports();
      // Ensure it is in local cache too
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([fullReport, ...currentReports]));
      return fullReport;
    } catch (e) {
      console.error("Firestore createReport failed, writing locally", e);
    }
  }

  // Local Storage path
  const local = localStorage.getItem(STORAGE_KEYS.REPORTS);
  const reports = local ? JSON.parse(local) : [];
  fullReport.id = "local-" + Math.random().toString(36).substr(2, 9);
  reports.unshift(fullReport);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  return fullReport;
};

export const updateReport = async (reportId: string, updates: Partial<Report>, updatedBy: string): Promise<void> => {
  const updatedAt = new Date().toISOString();
  const patch: any = { ...updates, updatedAt };

  // Calculate SLA if status is Selesai
  if (updates.status === 'Selesai') {
    patch.slaMet = true; // default value
    // Find original report to check SLA limit
    const reports = await getReports();
    const original = reports.find(r => r.id === reportId);
    if (original) {
      const createdTime = new Date(original.createdAt).getTime();
      const finishedTime = new Date().getTime();
      const hoursDiff = (finishedTime - createdTime) / (1000 * 60 * 60);
      
      let maxHours = 168; // default 7 days for Rendah
      if (original.priority === "Darurat") maxHours = 2;
      else if (original.priority === "Tinggi") maxHours = 24;
      else if (original.priority === "Sedang") maxHours = 72;

      patch.slaMet = hoursDiff <= maxHours;
    }
  }

  if (isFirebaseAvailable() && !reportId.startsWith("local-")) {
    try {
      const docRef = doc(db, "reports", reportId);
      await updateDoc(docRef, patch);
      console.log("Firestore report updated successfully");
    } catch (e) {
      console.error("Firestore updateReport failed, writing locally", e);
    }
  }

  // Always update local cache
  const local = localStorage.getItem(STORAGE_KEYS.REPORTS);
  if (local) {
    const reports = JSON.parse(local) as Report[];
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx !== -1) {
      const updatedReport = { ...reports[idx], ...patch };
      reports[idx] = updatedReport;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    }
  }
};

// 2. ASSETS SERVICE
export const getAssets = async (): Promise<Asset[]> => {
  if (isFirebaseAvailable()) {
    try {
      const snap = await getDocs(collection(db, "assets"));
      const list: Asset[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Asset);
      });
      if (list.length > 0) {
        // Deduplicate by assetCode to guarantee uniqueness of keys
        const uniqueList: Asset[] = [];
        const seenCodes = new Set<string>();
        for (const asset of list) {
          if (asset && asset.assetCode) {
            const code = asset.assetCode.trim();
            if (!seenCodes.has(code)) {
              seenCodes.add(code);
              uniqueList.push(asset);
            }
          }
        }
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(uniqueList));
        return uniqueList;
      }
    } catch (e) {
      console.warn("Firestore getAssets failed, falling back to localStorage", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.ASSETS);
  if (local) {
    try {
      const list = JSON.parse(local) as Asset[];
      const uniqueList: Asset[] = [];
      const seenCodes = new Set<string>();
      for (const asset of list) {
        if (asset && asset.assetCode) {
          const code = asset.assetCode.trim();
          if (!seenCodes.has(code)) {
            seenCodes.add(code);
            uniqueList.push(asset);
          }
        }
      }
      return uniqueList;
    } catch (e) {
      console.error("Failed to parse local assets", e);
    }
  }
  return [];
};

export const createAsset = async (asset: Omit<Asset, "id">): Promise<Asset> => {
  const fullAsset: Asset = {
    ...asset,
    maintenanceHistory: asset.maintenanceHistory || [],
    createdAt: new Date().toISOString()
  };

  if (isFirebaseAvailable()) {
    try {
      const docRef = await addDoc(collection(db, "assets"), fullAsset);
      fullAsset.id = docRef.id;
      return fullAsset;
    } catch (e) {
      console.error("Firestore createAsset failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.ASSETS);
  const assets = local ? JSON.parse(local) : [];
  fullAsset.id = "local-" + Math.random().toString(36).substr(2, 9);
  assets.unshift(fullAsset);
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  return fullAsset;
};

export const updateAsset = async (assetId: string, updates: Partial<Asset>): Promise<void> => {
  if (isFirebaseAvailable() && !assetId.startsWith("local-")) {
    try {
      const docRef = doc(db, "assets", assetId);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Firestore updateAsset failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.ASSETS);
  if (local) {
    const assets = JSON.parse(local) as Asset[];
    const idx = assets.findIndex(a => a.id === assetId);
    if (idx !== -1) {
      assets[idx] = { ...assets[idx], ...updates };
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    }
  }
};

// 3. LOCATIONS SERVICE
export const getLocations = async (): Promise<Location[]> => {
  console.log(`[dbService.getLocations] Initializing getLocations call. Firebase availability: ${isFirebaseAvailable()}, Target Database ID: "${databaseId}"`);
  
  if (isFirebaseAvailable()) {
    try {
      console.log(`[dbService.getLocations] Fetching "locations" collection from Firestore (database: "${databaseId}")...`);
      const snap = await getDocs(collection(db, "locations"));
      console.log(`[dbService.getLocations] Firestore response received successfully. Document count: ${snap.size}`);
      
      const list: Location[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const docId = docSnap.id;
        
        // Validate structure matches the expected Location interface
        const isValidStructure = typeof data.name === 'string' && typeof data.building === 'string';
        console.log(`[dbService.getLocations] Processing document "${docId}":`, {
          name: data.name,
          building: data.building,
          createdAt: data.createdAt,
          hasValidLocationStructure: isValidStructure
        });
        
        list.push({ id: docId, ...data } as Location);
      });
      
      if (list.length > 0) {
        console.log(`[dbService.getLocations] Successfully loaded and validated ${list.length} locations. Synchronizing with local storage.`);
        // Deduplicate by name and building
        const uniqueList: Location[] = [];
        const seen = new Set<string>();
        for (const loc of list) {
          if (loc && loc.name && loc.building) {
            const key = `${loc.name.trim()}_${loc.building.trim()}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueList.push(loc);
            }
          }
        }
        localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(uniqueList));
        return uniqueList;
      } else {
        console.warn(`[dbService.getLocations] Firestore returned an empty "locations" collection.`);
      }
    } catch (e: any) {
      console.error(`[dbService.getLocations] ERROR: Firestore getLocations call failed on database "${databaseId}". Error details:`, e);
    }
  } else {
    console.warn(`[dbService.getLocations] Firebase is not available. Falling back entirely to localStorage.`);
  }

  const local = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
  if (local) {
    try {
      const parsed = JSON.parse(local) as Location[];
      console.log(`[dbService.getLocations] Fallback: Successfully loaded ${parsed.length} locations from localStorage.`);
      const uniqueList: Location[] = [];
      const seen = new Set<string>();
      for (const loc of parsed) {
        if (loc && loc.name && loc.building) {
          const key = `${loc.name.trim()}_${loc.building.trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueList.push(loc);
          }
        }
      }
      return uniqueList;
    } catch (parseError) {
      console.error(`[dbService.getLocations] Fallback: Failed to parse locations from localStorage:`, parseError);
    }
  }
  
  console.warn(`[dbService.getLocations] Fallback: No locations found in localStorage. Returning empty array.`);
  return [];
};

export const createLocation = async (location: Omit<Location, "id" | "createdAt">): Promise<Location> => {
  const fullLoc: Location = {
    ...location,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseAvailable()) {
    try {
      const docRef = await addDoc(collection(db, "locations"), fullLoc);
      fullLoc.id = docRef.id;
      return fullLoc;
    } catch (e) {
      console.error("Firestore createLocation failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
  const locations = local ? JSON.parse(local) : [];
  fullLoc.id = "local-" + Math.random().toString(36).substr(2, 9);
  locations.push(fullLoc);
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  return fullLoc;
};

export const deleteLocation = async (locationId: string): Promise<void> => {
  if (isFirebaseAvailable() && !locationId.startsWith("local-")) {
    try {
      const docRef = doc(db, "locations", locationId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Firestore deleteLocation failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
  if (local) {
    const locations = JSON.parse(local) as Location[];
    const filtered = locations.filter(l => l.id !== locationId);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(filtered));
  }
};

// 4. CATEGORIES SERVICE
export const getCategories = async (): Promise<Category[]> => {
  if (isFirebaseAvailable()) {
    try {
      const snap = await getDocs(collection(db, "categories"));
      const list: Category[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      if (list.length > 0) {
        // Deduplicate by category name to avoid key warnings/errors from multiple seeding or duplicate entries
        const uniqueList: Category[] = [];
        const seenNames = new Set<string>();
        for (const cat of list) {
          if (cat && cat.name) {
            const trimmedName = cat.name.trim();
            if (!seenNames.has(trimmedName)) {
              seenNames.add(trimmedName);
              uniqueList.push(cat);
            }
          }
        }
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(uniqueList));
        return uniqueList;
      }
    } catch (e) {
      console.warn("Firestore getCategories failed, falling back to localStorage", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (local) {
    try {
      const list = JSON.parse(local) as Category[];
      const uniqueList: Category[] = [];
      const seenNames = new Set<string>();
      for (const cat of list) {
        if (cat && cat.name) {
          const trimmedName = cat.name.trim();
          if (!seenNames.has(trimmedName)) {
            seenNames.add(trimmedName);
            uniqueList.push(cat);
          }
        }
      }
      return uniqueList;
    } catch (err) {
      console.error("Failed to parse local categories", err);
    }
  }
  return [];
};

export const createCategory = async (category: Omit<Category, "id" | "createdAt">): Promise<Category> => {
  const fullCat: Category = {
    ...category,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseAvailable()) {
    try {
      const docRef = await addDoc(collection(db, "categories"), fullCat);
      fullCat.id = docRef.id;
      return fullCat;
    } catch (e) {
      console.error("Firestore createCategory failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  const categories = local ? JSON.parse(local) : [];
  fullCat.id = "local-" + Math.random().toString(36).substr(2, 9);
  categories.push(fullCat);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return fullCat;
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  if (isFirebaseAvailable() && !categoryId.startsWith("local-")) {
    try {
      const docRef = doc(db, "categories", categoryId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Firestore deleteCategory failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (local) {
    const categories = JSON.parse(local) as Category[];
    const filtered = categories.filter(c => c.id !== categoryId);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  }
};

// 5. USERS PROFILES SERVICE
export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (isFirebaseAvailable()) {
    try {
      const snap = await getDocs(collection(db, "users"));
      let matched: UserProfile | null = null;
      snap.forEach(docSnap => {
        const u = docSnap.data() as UserProfile;
        if (u.email && u.email.toLowerCase() === email.toLowerCase()) {
          matched = { uid: docSnap.id, ...u };
        }
      });
      if (matched) return matched;
    } catch (e) {
      console.warn("Firestore getUserProfileByEmail failed, checking local storage", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.USERS);
  if (local) {
    const users = JSON.parse(local) as UserProfile[];
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return matched || null;
  }
  return null;
};

export const createUserProfile = async (profile: UserProfile): Promise<void> => {
  if (isFirebaseAvailable()) {
    try {
      await setDoc(doc(db, "users", profile.uid), profile);
    } catch (e) {
      console.error("Firestore createUserProfile failed, saving locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.USERS);
  const users = local ? JSON.parse(local) : [];
  const idx = users.findIndex((u: UserProfile) => u.uid === profile.uid || u.email === profile.email);
  if (idx !== -1) {
    users[idx] = profile;
  } else {
    users.push(profile);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  if (isFirebaseAvailable()) {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: UserProfile[] = [];
      snap.forEach(docSnap => {
        list.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
      return list;
    } catch (e) {
      console.warn("Firestore getAllUsers failed, falling back to local storage", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.USERS);
  return local ? JSON.parse(local) : [];
};

export const updateUserRoleAndDivision = async (uid: string, role: UserRole, division: string, permissions?: Record<string, boolean>): Promise<void> => {
  if (isFirebaseAvailable() && !uid.startsWith("demo-")) {
    try {
      const docRef = doc(db, "users", uid);
      const updatePayload: any = { role, division };
      if (permissions) {
        updatePayload.permissions = permissions;
      }
      await updateDoc(docRef, updatePayload);
    } catch (e) {
      console.error("Firestore updateUserRole failed, updating locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.USERS);
  if (local) {
    const users = JSON.parse(local) as UserProfile[];
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx] = { 
        ...users[idx], 
        role, 
        division,
        ...(permissions ? { permissions } : {})
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }
};

export const deleteUserProfile = async (uid: string): Promise<void> => {
  if (isFirebaseAvailable() && !uid.startsWith("demo-")) {
    try {
      const docRef = doc(db, "users", uid);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Firestore deleteUserProfile failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.USERS);
  if (local) {
    const users = JSON.parse(local) as UserProfile[];
    const filtered = users.filter(u => u.uid !== uid);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  }
};

// --- DATABASE BACKUP & RESTORE OPERATIONS ---
export const getDatabaseBackupJson = async (): Promise<string> => {
  const reports = await getReports();
  const assets = await getAssets();
  const locations = await getLocations();
  const categories = await getCategories();
  const users = await getAllUsers();

  const backupObj = {
    backupDate: new Date().toISOString(),
    system: "SCB-CARE",
    data: {
      reports,
      assets,
      locations,
      categories,
      users
    }
  };

  return JSON.stringify(backupObj, null, 2);
};

export const restoreDatabaseFromJson = async (jsonString: string): Promise<boolean> => {
  try {
    const backupObj = JSON.parse(jsonString);
    if (backupObj.system !== "SCB-CARE" || !backupObj.data) {
      throw new Error("Invalid backup format for SCB-CARE");
    }

    const { reports, assets, locations, categories, users } = backupObj.data;

    if (reports) localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    if (assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    if (locations) localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
    if (categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    if (users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Seed back to Firebase Firestore if online
    if (isFirebaseAvailable()) {
      // Restore categories
      if (categories) {
        const catCol = collection(db, "categories");
        for (const cat of categories) {
          const { id, ...catData } = cat;
          await addDoc(catCol, catData);
        }
      }
      // Restore locations
      if (locations) {
        const locCol = collection(db, "locations");
        for (const loc of locations) {
          const { id, ...locData } = loc;
          await addDoc(locCol, locData);
        }
      }
      // Restore assets
      if (assets) {
        const astCol = collection(db, "assets");
        for (const ast of assets) {
          const { id, ...astData } = ast;
          await addDoc(astCol, astData);
        }
      }
      // Restore reports
      if (reports) {
        const repCol = collection(db, "reports");
        for (const rep of reports) {
          const { id, ...repData } = rep;
          await addDoc(repCol, repData);
        }
      }
    }

    return true;
  } catch (e) {
    console.error("Restore failed:", e);
    return false;
  }
};

// 6. ADDTIONAL UTILITIES FOR ADMIN RESET & BACKUP OPERATIONS
export const deleteReport = async (reportId: string): Promise<void> => {
  if (isFirebaseAvailable() && !reportId.startsWith("local-")) {
    try {
      const docRef = doc(db, "reports", reportId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Firestore deleteReport failed, writing locally", e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.REPORTS);
  if (local) {
    const reports = JSON.parse(local) as Report[];
    const filtered = reports.filter(r => r.id !== reportId);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
  }
};

export const clearAndSeedAll = async (): Promise<void> => {
  if (isFirebaseAvailable()) {
    try {
      const collectionsToClear = ["categories", "locations", "assets", "reports"];
      for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(db, colName));
        for (const docSnap of snap.docs) {
          await deleteDoc(doc(db, colName, docSnap.id));
        }
      }
    } catch (e) {
      console.error("Gagal membersihkan Firestore sebelum seeding:", e);
    }
  }

  localStorage.removeItem("scb_db_seeded");
  localStorage.removeItem(STORAGE_KEYS.REPORTS);
  localStorage.removeItem(STORAGE_KEYS.ASSETS);
  localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.setItem("scb_demo_reports_purged", "true");
  
  await ensureDatabaseSeeded();
};

export const restoreRawBackup = async (parsed: any): Promise<void> => {
  if (parsed.reports) localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(parsed.reports));
  if (parsed.assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(parsed.assets));
  if (parsed.locations) localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(parsed.locations));
  if (parsed.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(parsed.categories));
};
