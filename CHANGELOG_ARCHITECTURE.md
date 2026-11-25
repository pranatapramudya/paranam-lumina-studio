# Log Perubahan Arsitektur — Paranam Lumina Studio

## Standar Arsitektur (`paranam-studio`)
- **Pemisahan Koki & Pelayan:** Seluruh rute (`/`, `/jadwal`, `/tiket`, `/verify/[memberCode]`, `/2026/sign-in`, `/2026/dashboard`, `/2026/personal-trainer`, `/2026/transactions`, `/2026/scanner`) menggunakan `page.tsx` sebagai Server Component.
- **Alur Publik Tanpa Login:** Checkout tamu berbasis Nama & WhatsApp dengan hold kursi 15 menit (`expireStaleGuestHolds`) dan batas maks. 2 transaksi pending per nomor WA.
- **E-Ticket 2 Tab:** Pemisahan *Tiket Aktif* vs *Riwayat Transaksi* dengan penyimpanan nomor WA di perangkat (`localStorage`).
- **Panel Admin / Kasir Tanpa Sidebar:** Navigasi top bar + floating active bottom bar bertema sage cerah (`#C8E0D5` / `#4D7762`), manajemen profil & PIN kasir, CRUD jadwal dengan kompresi foto + jam 24-jam WIB + kloning mingguan, kas masuk/keluar dengan kalkulator kembalian tunai, export Excel multi-sheet (Harian/Mingguan/Bulanan/Custom), serta scanner QR kamera & gambar.
- **Keamanan Portal Internal:** Tautan admin/kasir tidak ditampilkan di footer halaman publik; diakses langsung melalui `/2026/sign-in`.
