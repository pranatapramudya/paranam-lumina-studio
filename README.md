# Paranam Lumina Studio (`paranam-studio`)

Aplikasi web booking kelas studio & panel operasional kasir untuk **Paranam Lumina Studio** (Yoga, Pilates & Sound Healing — Depok, Jawa Barat). Dibangun dengan **Next.js App Router**, **Tailwind CSS v4**, dan **PostgreSQL (Neon + Prisma)**.

## Fitur Utama

### 1. Halaman Konsumen (Tanpa Login / Tanpa Daftar)
- **Jadwal 7 Hari ke Depan (Otomatis WIB):** Menampilkan jadwal mulai hari ini hingga 7 hari ke depan dengan sisa kuota matras real-time, filter instruktur, dan pencarian kelas.
- **Alur Booking 3 Langkah (Fullscreen Dinamis):** Pilih kelas → isi Nama & No. WhatsApp → pilih metode bayar (**QRIS / Transfer BCA / Bayar Tunai di Studio**) dengan batas waktu pembayaran 15 menit.
- **E-Ticket Saya (`/tiket`):** Cek via nomor WhatsApp (auto-tersimpan di perangkat) dengan 2 tab bersih (**Tiket Aktif** berisi QR Code masuk studio & **Riwayat Transaksi**), serta verifikasi QR (`/verify/[code]`).

### 2. Portal Admin / Kasir (`/2026/sign-in`)
- **Akses Tunggal PIN + Profil Kasir:** Login 6 digit PIN, dilengkapi toggle show/hide PIN, fitur lupa/reset PIN via verifikasi WhatsApp studio, serta pengaturan ganti nama & PIN kasir di navbar kanan.
- **Dashboard Studio (`/2026/dashboard`):** Ringkasan total booking, pendapatan lunas, pengeluaran kasir & kas bersih, grafik pendapatan, auto-sync 10 menit tanpa kedip, dan unduh **Laporan Excel** (**Harian, Mingguan, Bulanan, Custom**).
- **Jadwal & Booking (`/2026/personal-trainer`):** Kelola pesanan tamu (Acc Bayar, Hadir, Batal), plus CRUD jadwal kelas lengkap dengan **Upload & Kompresi Foto Kelas**, pemilih jam 24-jam **WIB**, pilih hari tetap, dan **Terapkan Jadwal ke Minggu Depan (+7 Hari)**.
- **Kas & Keuangan (`/2026/transactions`):** Pemasukan booking (incl. input pembayaran walk-in/tunai/paket kasir + kalkulator uang kembalian), catatan pengeluaran operasional studio, dan filter tanggal WIB akurat.
- **Scanner QR E-Ticket (`/2026/scanner`):** Pemindai QR Code kamera/webcam (area scan dinamis 85% + scan dari gambar + input kode manual).

## Standar Arsitektur (SOP)
- `app/**/page.tsx` adalah **Server Component (Koki)** yang mengambil data dari PostgreSQL dan meneruskan ke Client Component (`*Client.tsx` / `ParanamBookingView.tsx`).
- Mutasi data menggunakan **Next.js Server Actions** (`app/actions/public.ts`, `app/actions/admin.ts`, `app/actions/auth.ts`).
- Setiap rute utama memiliki `loading.tsx` dan `error.tsx`.
- Pagination responsif seragam (`5` item di mobile, `10` item di desktop) via `useResponsivePagination`.

## Menjalankan Secara Lokal
```bash
npm install
npx prisma generate
npm run dev -- -p 3003
```
