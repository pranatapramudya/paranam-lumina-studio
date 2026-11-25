# Arsitektur Sistem Paranam Lumina Studio

Dokumen ini merangkum arsitektur teknis, model data, dan pola kode aplikasi **Paranam Lumina Studio (`paranam-studio`)**.

## 1. Stack Teknologi
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database & ORM:** PostgreSQL (Neon) + Prisma ORM (`prisma/schema.prisma`)
- **UI & Styling:** Tailwind CSS v4 (Tema Sage Pastel `#C8E0D5` / Sage Solid `#4D7762` / Linen `#F6F4EF`) + Lucide Icons
- **QR & Export:** `react-qr-code`, `html5-qrcode`, `xlsx`, `jspdf`, `recharts`

## 2. Model Database (`prisma/schema.prisma`)
- **`User`**: Menyimpan identitas tamu (berdasarkan `phone` WhatsApp unik) dan akun Admin/Kasir (`OWNER` / `KASIR` dengan PIN 6 digit).
- **`ClassSchedule`**: Menyimpan jadwal kelas Yoga, Pilates, dan Sound Healing beserta instruktur, foto (`instructorPhoto`), tanggal (`date`), jam mulai/selesai (`startTime`, `endTime`), harga, dan kuota matras (`maxCapacity`).
- **`Booking`**: Menghubungkan `User` dan `ClassSchedule`, menyimpan `bookingCode`, metode bayar (`QRIS_MANUAL`, `TRANSFER_MANUAL`, `CASH_STUDIO`), status bayar (`PENDING`, `PAID`, `REJECTED`), status kehadiran (`PENDING`, `ATTENDED`, `CANCELLED`), dan nominal.
- **`Package`**: Paket sesi studio untuk pilihan tarif saat transaksi kasir/walk-in.
- **`Transaction`**: Mencatat invoice transaksi & pencatatan **Pengeluaran Studio** (`type` berawalan `EXPENSE:`).
- **`StudioSetting`**: Konfigurasi nama studio, alamat, nomor WhatsApp resmi, dan rekening BCA studio.

## 3. Pola Koki & Pelayan (Next.js App Router SOP)
- **Server Components (`page.tsx`):** Mengambil data langsung dari database via Prisma atau Server Actions (`getPublicSchedule`, `getGuestTicketsByPhone`, query admin) dan mengecek autentikasi (`auth()` / `getSession()`) sebelum me-render UI.
- **Client Components (`*Client.tsx`, `ParanamBookingView.tsx`):** Khusus menangani interaksi pengguna, filter, pencarian, pagination (`useResponsivePagination`), modal, dan pemindaian kamera QR.
- **Error & Loading Boundary:** `app/loading.tsx`, `app/error.tsx`, `app/tiket/loading.tsx`, `app/tiket/error.tsx`, `app/2026/loading.tsx`, dan `app/2026/error.tsx`.
