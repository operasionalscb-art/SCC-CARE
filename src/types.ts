export type UserRole = 'Pegawai' | 'GA' | 'Administrator';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  division: string;
  photo?: string;
  photoURL?: string;
  password?: string;
  createdAt: string;
  permissions?: Record<string, boolean>;
}

export interface Comment {
  id: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  commentText: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  status: string;
  note: string;
  updatedBy: string;
}

export interface Report {
  id?: string;
  ticketNumber: string;
  reporter: string;
  email: string;
  division: string;
  location: string;
  building: string;
  floor: string;
  room: string;
  category: string;
  assetCode: string;
  assetName: string;
  title: string;
  description: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';
  status: 'Menunggu' | 'Diverifikasi' | 'Diproses' | 'Menunggu Sparepart' | 'Selesai' | 'Ditolak';
  assignedTo?: string; // PIC
  estimateFinish?: string; // date string
  beforePhotos: string[]; // base64 strings
  afterPhotos: string[]; // base64 strings
  timeline: TimelineEvent[];
  comments: Comment[];
  gps?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
  slaMet?: boolean;
  slaLimitTime?: string;
}

export interface Asset {
  id?: string;
  assetCode: string;
  assetName: string;
  category: string;
  location: string;
  building: string;
  floor: string;
  room: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  assetValue: number;
  condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  qrCode?: string;
  photo?: string; // base64
  maintenanceHistory: {
    date: string;
    type: string;
    description: string;
    cost: number;
    performedBy: string;
  }[];
  createdAt: string;
}

export interface Location {
  id?: string;
  name: string;
  building: string;
  createdAt: string;
}

export interface Category {
  id?: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind bg class
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  ticketNumber?: string;
}
