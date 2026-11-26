# Paranam Lumina Studio — AI Agent Context

## Apa Ini?
Sistem Booking & Admin Kasir untuk studio Yoga / Pilates / Sound Healing.
Frontend konsumen + Dashboard Admin/Kasir. 100% cloud-native di Vercel.

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Prisma ORM + PostgreSQL (Neon/Supabase)
- **UI:** Tailwind CSS 4, FLOQ Fintech Aesthetic (Deep Pine Forest `#061a1d`, Mint `#4D7762`, Cream `#F6F4EF`)
- **Auth:** Custom session-based (Owner / Kasir roles)
- **Deploy:** Vercel Production

## Arsitektur
```
app/
├── page.tsx                  → Frontend konsumen (booking publik)
├── tiket/                    → E-Ticket halaman (download PNG)
├── 2026/                     → Admin area
│   ├── layout.tsx            → Admin layout + navbar
│   ├── sign-in/              → Login admin/kasir
│   ├── scanner/              → QR Scanner check-in
│   ├── personal-trainer/     → Kelola Jadwal & Kelas + Paket & Tarif (CRUD)
│   └── transactions/        → Pemasukan, Pengeluaran, Kasir
components/
├── public/ParanamBookingView → Komponen utama booking konsumen
├── admin/AdminNavbar         → Bottom nav admin
config/
├── studio.json               → Info studio (nama, alamat, WA, rekening)
```

## Fitur Utama
1. **Booking Konsumen** — Pilih kelas → Form → Pembayaran (QRIS/Transfer/Di Studio) → E-Ticket
2. **Download E-Ticket PNG** — Canvas-rendered ticket dengan QR code
3. **Admin Dashboard** — Overview statistik booking & keuangan
4. **Kelola Jadwal** — CRUD jadwal kelas (hari, jam, instruktur, matras)
5. **Paket & Tarif** — CRUD paket sesi/keanggotaan (Single, Multi-sesi, dll)
6. **Kasir Manual** — Input pembayaran walk-in (Per Jadwal Kelas / Per Paket & Tarif)
7. **QR Scanner** — Scan e-ticket untuk check-in murid
8. **Keuangan** — Pemasukan & pengeluaran harian/bulanan
9. **Silent Auto-Refresh** — Frontend & admin refresh data tiap 3 menit tanpa flicker

## Changelog (Nov 2026)
- ✅ Fix Scanner QR camera bug di mobile/iOS
- ✅ Fix time picker dropdown clipped di iOS
- ✅ Fix form spacing admin (create/update/delete)
- ✅ Fix booking table responsive (card-based di mobile)
- ✅ Fix jadwal kelas card layout
- ✅ Fix kas/keuangan card spacing
- ✅ Add silent auto-refresh 3 menit (frontend + admin)
- ✅ Add download E-Ticket PNG via HTML5 Canvas
- ✅ Restore desktop grid Kelola Jadwal
- ✅ Fix DateRangePicker floating di mobile
- ✅ Add full CRUD Paket & Tarif admin tab
- ✅ Show Paket & Tarif di frontend konsumen
- ✅ Kasir modal 2 opsi (Per Jadwal / Per Paket & Tarif)
- ✅ WhatsApp opsional untuk walk-in customer
- ✅ Add "Powered by PranajayaTech" branding (frontend + admin)

## Rules untuk Agent
1. Repo ini **standalone** — tidak terintegrasi dengan ekosistem lain
2. Pertahankan performa mobile (touch-manipulation, non-intrusive refresh)
3. Desain FLOQ: warna pine forest, mint, cream — konsisten di seluruh UI
4. E-Ticket canvas footer sudah ada "Diterbitkan oleh PranajayaTech"

## License
© 2026 PranajayaTech — All rights reserved.
