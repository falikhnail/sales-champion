# FurniPrice - Sistem Kalkulasi Harga Furniture

<div align="center">
  <img src="public/icons/icon-192x192.png" alt="FurniPrice Logo" width="120" height="120">
  
  **Sistem kalkulasi harga jual furniture profesional dengan manajemen produk dan pelanggan**
  
  [![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)
  [![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
</div>

---

## 📋 Deskripsi

FurniPrice adalah aplikasi web progresif (PWA) yang dirancang khusus untuk bisnis furniture dan mebel. Sistem ini membantu menghitung harga jual dengan mempertimbangkan berbagai faktor seperti harga dasar, margin keuntungan, diskon, dan harga regional.

## ✨ Fitur Utama

### 🛋️ Manajemen Produk
- **Kategori Furniture**: Sofa, Meja, Kursi, Lemari, Tempat Tidur, Lampu, Rak Buku, TV Stand, Perlengkapan Kamar Mandi, Perlengkapan Dapur
- **Filter Kategori**: Filter produk berdasarkan kategori dengan icon visual
- **Harga Regional**: Atur harga berbeda untuk setiap wilayah/region
- **Import/Export**: Backup dan restore data produk dalam format Excel

### 💰 Kalkulasi Harga
- **Margin Calculator**: Hitung margin keuntungan dengan persentase atau nominal
- **Discount Calculator**: Terapkan berbagai jenis diskon (persentase, nominal, bertingkat)
- **Price Summary**: Ringkasan harga lengkap dengan breakdown komponen

### 👥 Manajemen Pelanggan
- **Database Pelanggan**: Simpan data pelanggan lengkap
- **Tier Diskon**: Atur tier diskon khusus per pelanggan
- **Riwayat Harga**: Lacak history penawaran harga ke pelanggan

### 📊 Riwayat & Laporan
- **Price History**: Catatan lengkap semua kalkulasi harga
- **Export Laporan**: Export data ke Excel/PDF
- **Data Backup**: Backup otomatis dan manual ke cloud

### 📱 Progressive Web App (PWA)
- **Installable**: Install langsung dari browser ke home screen
- **Offline Ready**: Akses data tanpa koneksi internet
- **Responsive**: Optimal di desktop, tablet, dan mobile

## 🚀 Cara Menggunakan

### Install sebagai Aplikasi

#### Android (Chrome)
1. Buka aplikasi di Chrome
2. Tap menu (⋮) di pojok kanan atas
3. Pilih "Install app" atau "Add to Home screen"
4. Konfirmasi instalasi

#### iPhone/iPad (Safari)
1. Buka aplikasi di Safari
2. Tap tombol Share (□↑)
3. Scroll dan pilih "Add to Home Screen"
4. Tap "Add"

#### Desktop (Chrome/Edge)
1. Buka aplikasi di browser
2. Klik icon install (⊕) di address bar
3. Konfirmasi instalasi

## 🛠️ Teknologi

| Teknologi | Deskripsi |
|-----------|-----------|
| **React 18** | Library UI modern dengan hooks |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Komponen UI yang accessible |
| **Vite** | Build tool yang cepat |
| **Supabase** | Backend-as-a-Service (database, auth) |
| **React Query** | Server state management |
| **PWA** | Progressive Web App support |

## 📁 Struktur Proyek

```
src/
├── components/          # Komponen React
│   ├── ui/             # Komponen shadcn/ui
│   ├── CustomerManager.tsx
│   ├── DiscountCalculator.tsx
│   ├── MarginCalculator.tsx
│   ├── PriceHistory.tsx
│   ├── PriceList.tsx
│   ├── PriceSummary.tsx
│   ├── ProductManager.tsx
│   └── ProductSidebar.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
│   ├── furnitureCategories.ts
│   ├── exportUtils.ts
│   └── utils.ts
├── pages/              # Halaman aplikasi
│   ├── Index.tsx
│   ├── Install.tsx
│   └── NotFound.tsx
├── types/              # TypeScript types
├── integrations/       # Integrasi Supabase
└── data/               # Sample data
```

## 🔧 Development Lokal

### Prasyarat
- Node.js 18+ 
- npm atau bun

### Instalasi

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`

### Build Production

```bash
npm run build
```

## 📊 Database Schema

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `products` | Data produk furniture |
| `product_regions` | Harga regional per produk |
| `customers` | Data pelanggan |
| `customer_pricing_tiers` | Tier diskon pelanggan |
| `price_history` | Riwayat kalkulasi harga |

## 🔐 Keamanan

- Row Level Security (RLS) aktif di semua tabel
- Data terenkripsi saat transit
- Backup otomatis ke cloud

## 📝 Lisensi

Proyek ini dibuat dengan ❤︎

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📞 Dukungan

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

<div align="center">
  Made with ❤️ for Indonesian Furniture Business
</div>
