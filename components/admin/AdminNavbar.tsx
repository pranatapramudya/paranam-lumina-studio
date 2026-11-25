"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  QrCode,
  LogOut,
  ExternalLink,
  Settings,
  User,
  KeyRound,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";
import { logoutAction, updateAdminProfile } from "@/app/actions/auth";

const navItems = [
  {
    href: "/2026/dashboard",
    label: "Dashboard",
    shortLabel: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/2026/personal-trainer",
    label: "Jadwal & Booking",
    shortLabel: "Jadwal",
    icon: CalendarDays,
  },
  {
    href: "/2026/transactions",
    label: "Kas & Keuangan",
    shortLabel: "Keuangan",
    icon: Receipt,
  },
  {
    href: "/2026/scanner",
    label: "Scanner QR",
    shortLabel: "Scanner",
    icon: QrCode,
  },
];

interface AdminNavbarProps {
  adminName: string;
}

export function AdminNavbar({ adminName }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(adminName);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"PROFILE" | "PIN">("PROFILE");
  const [panduanOpen, setPanduanOpen] = useState(false);
  const [panduanTab, setPanduanTab] = useState<
    "DASHBOARD" | "JADWAL" | "KAS" | "SCANNER"
  >("DASHBOARD");

  // Settings form state
  const [nameInput, setNameInput] = useState(adminName);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayName(adminName);
    setNameInput(adminName);
  }, [adminName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Anti-bocor: Jangan render navbar admin di halaman sign-in
  if (pathname?.startsWith("/2026/sign-in")) {
    return null;
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "AK";

  const handleOpenSettings = (tab: "PROFILE" | "PIN") => {
    setSettingsTab(tab);
    setSaveMsg(null);
    setCurrentPin("");
    setNewPin("");
    setProfileOpen(false);
    setSettingsOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const res = await updateAdminProfile({
      name: nameInput,
      ...(settingsTab === "PIN" ? { currentPin, newPin } : {}),
    });
    setSaving(false);
    if (res.success) {
      if (res.name) setDisplayName(res.name);
      setSaveMsg({
        type: "ok",
        text:
          settingsTab === "PIN"
            ? "PIN akses & profil berhasil diperbarui!"
            : "Nama Admin / Kasir berhasil diperbarui!",
      });
      setCurrentPin("");
      setNewPin("");
      router.refresh();
    } else {
      setSaveMsg({
        type: "err",
        text: res.error || "Gagal menyimpan pengaturan.",
      });
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await logoutAction("/2026/sign-in");
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          TOP NAVBAR (Sage Pastel Cerah #C8E0D5 — Tanpa Sidebar)
      ═══════════════════════════════════════════════════════════ */}
      <header className="print:hidden sticky top-0 z-40 w-full bg-[#C8E0D5] border-b border-[#A8C8B8] shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-4">
          {/* Brand Kiri */}
          <Link
            href="/2026/dashboard"
            className="flex items-center gap-2.5 shrink-0 md:justify-self-start"
          >
            <div className="w-9 h-9 rounded-xl bg-[#4D7762] text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
              PL
            </div>
            <div>
              <span className="text-[#1D3D30] font-extrabold text-sm sm:text-[15px] tracking-tight block leading-none">
                PARANAM LUMINA
              </span>
              <span className="text-[#3B6251] text-[10px] font-bold tracking-wider uppercase block mt-0.5">
                Admin / Kasir
              </span>
            </div>
          </Link>

          {/* Menu Tengah (Desktop) dengan Active Pill Menyala */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#B4D3C4]/60 p-1.5 rounded-2xl border border-[#A8C8B8] md:justify-self-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-[#4D7762] text-white shadow-md shadow-[#4D7762]/25"
                      : "text-[#2A5040] hover:bg-white/50 hover:text-[#1D3D30]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Kanan: Profile Kasir + Pengaturan + Sign Out */}
          <div
            className="relative flex items-center gap-2 md:justify-self-end"
            ref={dropdownRef}
          >
            <Link
              href="/"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-[#2A5040] text-xs font-bold border border-[#A8C8B8] transition-colors"
            >
              <span>Web Konsumen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Buku Panduan Button */}
            <button
              type="button"
              onClick={() => {
                setPanduanOpen(true);
                setProfileOpen(false);
              }}
              title="Buku Panduan Kasir"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/60 hover:bg-white text-[#2A5040] text-xs font-bold border border-[#A8C8B8] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panduan</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#A8C8B8] shadow-xs transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#4D7762] text-white text-xs font-extrabold flex items-center justify-center">
                {initials}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-[#1D3D30] max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#3B6251] transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#E6E2D8] shadow-xl z-50 overflow-hidden">
                {/* Bagian 1: Info Akun */}
                <div className="px-4 py-3.5 bg-[#E9EFEA]/70 border-b border-[#E6E2D8] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4D7762] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#162620] truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] font-semibold text-[#4D7762]">
                      Kasir & Pengelola Studio
                    </p>
                  </div>
                </div>

                {/* Bagian 2: Pengaturan */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenSettings("PROFILE")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#162620] hover:bg-[#F6F4EF] transition-colors cursor-pointer text-left"
                  >
                    <User className="w-4 h-4 text-[#4D7762]" />
                    <div>
                      <span className="block">Profil Admin / Kasir</span>
                      <span className="text-[10px] font-normal text-[#5D6E66]">
                        Ubah nama tampilan kasir
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSettings("PIN")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#162620] hover:bg-[#F6F4EF] transition-colors cursor-pointer text-left"
                  >
                    <KeyRound className="w-4 h-4 text-[#4D7762]" />
                    <div>
                      <span className="block">Pengaturan PIN / Password</span>
                      <span className="text-[10px] font-normal text-[#5D6E66]">
                        Ganti 6 digit PIN login
                      </span>
                    </div>
                  </button>

                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#162620] hover:bg-[#F6F4EF] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-[#4D7762]" />
                    <span>Lihat Halaman Konsumen</span>
                  </Link>
                </div>

                {/* Bagian 3: Sign Out */}
                <div className="p-1.5 border-t border-[#F0EDE5]">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    {signingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span>
                      {signingOut ? "Keluar..." : "Sign Out (Keluar Admin)"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM NAVBAR (Mobile — Active Pill Muncul & Menyala!)
      ═══════════════════════════════════════════════════════════ */}
      <nav className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#C8E0D5]/95 backdrop-blur-md border-t border-[#A8C8B8] shadow-[0_-4px_20px_rgba(29,61,48,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 h-[68px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center transition-all duration-200 touch-manipulation ${
                  active
                    ? "-translate-y-2 bg-[#4D7762] text-white px-4 py-2 rounded-2xl shadow-lg shadow-[#4D7762]/40 ring-2 ring-white/80"
                    : "text-[#2A5040]/75 hover:text-[#1D3D30] px-3 py-1.5 rounded-xl"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.9]"}`}
                />
                <span
                  className={`text-[10px] mt-0.5 tracking-tight ${active ? "font-extrabold" : "font-semibold"}`}
                >
                  {item.shortLabel}
                </span>
                {active && (
                  <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#4D7762]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          MODAL BUKU PANDUAN KASIR
      ═══════════════════════════════════════════════════════════ */}
      {panduanOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#162620]/50 backdrop-blur-xs"
          onClick={() => setPanduanOpen(false)}
        >
          <div
            className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl border border-[#E6E2D8] shadow-2xl overflow-hidden max-h-[85dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-[#C8E0D5] border-b border-[#A8C8B8] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4D7762] text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1D3D30]">
                    Buku Panduan Admin / Kasir
                  </h3>
                  <p className="text-[11px] text-[#3B6251]">
                    Cara menggunakan setiap fitur panel operasional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPanduanOpen(false)}
                className="p-1.5 rounded-lg text-[#2A5040] hover:bg-white/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab selector */}
            <div className="px-5 pt-4 pb-0 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {(
                [
                  { id: "DASHBOARD", label: "📊 Dashboard" },
                  { id: "JADWAL", label: "📅 Jadwal & Booking" },
                  { id: "KAS", label: "💰 Kas & Keuangan" },
                  { id: "SCANNER", label: "📷 Scanner QR" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPanduanTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 mb-3 ${
                    panduanTab === t.id
                      ? "bg-[#4D7762] text-white"
                      : "bg-[#F6F4EF] text-[#5D6E66] hover:bg-[#E9EFEA]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1 text-xs text-[#162620] space-y-4">
              {panduanTab === "DASHBOARD" && (
                <div className="space-y-3">
                  <div className="bg-[#E9EFEA] rounded-2xl p-4 space-y-1">
                    <p className="font-extrabold text-[#1D3D30] text-sm">
                      📊 Halaman Dashboard
                    </p>
                    <p className="text-[#3B6251]">
                      Ringkasan harian booking, pemasukan, dan kehadiran murid.
                    </p>
                  </div>
                  {[
                    {
                      step: "1",
                      title: "Lihat Ringkasan Hari Ini",
                      desc: "Angka di kartu atas (Total Booking, Lunas, Hadir, Pemasukan) auto-refresh setiap 10 menit. Tidak perlu refresh manual.",
                    },
                    {
                      step: "2",
                      title: "Filter Periode Tanggal",
                      desc: "Klik tombol tanggal di kanan atas → Pilih rentang tanggal (hari ini, kemarin, minggu ini, atau custom) → klik 'Terapkan'.",
                    },
                    {
                      step: "3",
                      title: "Unduh Laporan Excel / PDF",
                      desc: "Klik tombol 'Unduh Laporan' → pilih format Excel atau PDF. File berisi semua data booking & keuangan sesuai filter tanggal.",
                    },
                    {
                      step: "4",
                      title: "Auto-sync Tanpa Kedip",
                      desc: "Badge 'Auto-sync 10m' artinya data diperbarui otomatis di latar belakang tanpa reload halaman. Angka berubah halus.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 items-start">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#4D7762] text-white text-[10px] font-black flex items-center justify-center">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-bold text-[#162620]">{item.title}</p>
                        <p className="text-[#5D6E66] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {panduanTab === "JADWAL" && (
                <div className="space-y-3">
                  <div className="bg-[#E9EFEA] rounded-2xl p-4 space-y-1">
                    <p className="font-extrabold text-[#1D3D30] text-sm">
                      📅 Jadwal Kelas & Booking
                    </p>
                    <p className="text-[#3B6251]">
                      Kelola jadwal studio dan konfirmasi booking murid dari
                      halaman publik.
                    </p>
                  </div>
                  {[
                    {
                      step: "1",
                      title: "Konfirmasi Pembayaran (ACC Lunas)",
                      desc: "Di tab Daftar Booking → cari booking status 'Menunggu Bayar' → klik tombol ✓ Lunas. Jika murid bayar tunai, masukkan nominal diterima untuk hitung kembalian, lalu klik Konfirmasi.",
                    },
                    {
                      step: "2",
                      title: "Tandai Murid Hadir",
                      desc: "Setelah booking Lunas → klik tombol 'Hadir' (atau scan QR di menu Scanner). Status berubah menjadi 'Sudah Hadir'.",
                    },
                    {
                      step: "3",
                      title: "Tambah Jadwal Kelas Baru",
                      desc: "Klik tab 'Kelola Jadwal' → isi form: Nama Kelas, Kategori, Instruktur, Tanggal, Jam Mulai–Selesai, Harga, Kapasitas → klik 'Simpan Jadwal'. Jadwal langsung tampil di halaman konsumen.",
                    },
                    {
                      step: "4",
                      title: "Edit atau Hapus Jadwal",
                      desc: "Di daftar Kelola Jadwal → klik ✏ untuk edit atau 🗑 untuk hapus. Jadwal yang sudah full atau sudah lewat tanggalnya bisa dihapus.",
                    },
                    {
                      step: "5",
                      title: "Terapkan Jadwal ke Minggu Depan",
                      desc: "Klik tombol 'Terapkan Jadwal ke Minggu Depan (+7 Hari)'. Semua jadwal aktif diklon dengan tanggal +7 hari, booking count mulai dari 0 lagi.",
                    },
                    {
                      step: "6",
                      title: "Filter Booking per Status / Instruktur",
                      desc: "Gunakan pill filter 'Status' dan 'Instruktur' untuk menyaring daftar booking. Misal: lihat hanya booking instruktur Oka yang belum bayar.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 items-start">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#4D7762] text-white text-[10px] font-black flex items-center justify-center">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-bold text-[#162620]">{item.title}</p>
                        <p className="text-[#5D6E66] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {panduanTab === "KAS" && (
                <div className="space-y-3">
                  <div className="bg-[#E9EFEA] rounded-2xl p-4 space-y-1">
                    <p className="font-extrabold text-[#1D3D30] text-sm">
                      💰 Kas & Keuangan
                    </p>
                    <p className="text-[#3B6251]">
                      Catat pemasukan (tunai/walk-in) dan pengeluaran
                      operasional studio.
                    </p>
                  </div>
                  {[
                    {
                      step: "1",
                      title: "Lihat Pemasukan Booking",
                      desc: "Tab 'Pemasukan Booking' menampilkan semua pembayaran yang sudah dikonfirmasi. Filter berdasarkan status atau tanggal menggunakan picker di kanan atas.",
                    },
                    {
                      step: "2",
                      title: "Input Bayar Kasir (Tunai / Walk-in)",
                      desc: "Klik tombol '+ Bayar di Kasir (Tunai / Walk-in)' → isi Nama, No. WA, pilih Jadwal Kelas → pilih Metode Bayar → masukkan Uang Diterima → sistem hitung kembalian otomatis → klik 'Catat Lunas & Terbitkan Tiket'.",
                    },
                    {
                      step: "3",
                      title: "Catat Pengeluaran Studio",
                      desc: "Tab 'Pengeluaran Kasir' → pilih Kategori (Fee Instruktur, Perlengkapan, Listrik & Air, dll) → isi Keterangan → masukkan Nominal → pilih Sumber Dana → klik '+ Simpan Pengeluaran'.",
                    },
                    {
                      step: "4",
                      title: "Kalkulator Kembalian",
                      desc: "Saat konfirmasi pembayaran tunai, kolom 'Uang Diterima' akan menghitung kembalian secara otomatis (Uang Diterima − Total Bayar = Kembalian).",
                    },
                    {
                      step: "5",
                      title: "Unduh Laporan Keuangan PDF",
                      desc: "Klik tombol 'Unduh PDF' di bagian atas. File PDF berisi daftar transaksi sesuai filter tanggal yang aktif.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 items-start">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#4D7762] text-white text-[10px] font-black flex items-center justify-center">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-bold text-[#162620]">{item.title}</p>
                        <p className="text-[#5D6E66] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {panduanTab === "SCANNER" && (
                <div className="space-y-3">
                  <div className="bg-[#E9EFEA] rounded-2xl p-4 space-y-1">
                    <p className="font-extrabold text-[#1D3D30] text-sm">
                      📷 Scanner QR E-Ticket
                    </p>
                    <p className="text-[#3B6251]">
                      Verifikasi kehadiran murid dengan scan QR code dari
                      E-Ticket mereka.
                    </p>
                  </div>
                  {[
                    {
                      step: "1",
                      title: "Scan QR via Kamera",
                      desc: "Buka halaman Scanner QR → klik 'Mulai Scan' → arahkan kamera ke QR code di E-Ticket murid. Sistem otomatis mendeteksi dan verifikasi.",
                    },
                    {
                      step: "2",
                      title: "Scan QR dari Gambar (Screenshot)",
                      desc: "Jika murid menunjukkan screenshot E-Ticket → klik tombol '📁 Unggah Gambar QR' → pilih foto dari galeri/file → sistem membaca QR dari gambar.",
                    },
                    {
                      step: "3",
                      title: "Input Kode Manual",
                      desc: "Jika QR tidak terbaca → minta murid tunjukkan Kode Booking (format: PRM-XXXXXX) → masukkan manual di kolom input → klik 'Verifikasi'.",
                    },
                    {
                      step: "4",
                      title: "Hasil Verifikasi",
                      desc: "✅ Hijau = Booking valid & murid ditandai Hadir. ❌ Merah = Kode tidak ditemukan atau sudah dipakai. Pastikan status booking murid Lunas sebelum scan.",
                    },
                    {
                      step: "5",
                      title: "Tips Scan Optimal",
                      desc: "Pastikan cahaya cukup, jarak kamera 15–30 cm dari QR code, dan QR tidak buram. Perbesar layar murid jika QR kecil.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 items-start">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#4D7762] text-white text-[10px] font-black flex items-center justify-center">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-bold text-[#162620]">{item.title}</p>
                        <p className="text-[#5D6E66] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 font-semibold leading-relaxed">
                    ⚠️ Scan QR hanya bisa dilakukan setelah booking berstatus{" "}
                    <strong>Lunas</strong>. Konfirmasi pembayaran dulu di menu
                    Jadwal & Booking atau Kas & Keuangan.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#F0EDE5] shrink-0">
              <button
                type="button"
                onClick={() => setPanduanOpen(false)}
                className="w-full py-2.5 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL PENGATURAN PROFIL & PIN KASIR
      ═══════════════════════════════════════════════════════════ */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#162620]/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E2D8] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#C8E0D5] border-b border-[#A8C8B8] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4D7762] text-white flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1D3D30]">
                    Pengaturan Akun Kasir
                  </h3>
                  <p className="text-[11px] text-[#3B6251]">
                    Kelola profil & keamanan PIN akses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg text-[#2A5040] hover:bg-white/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs di dalam pengaturan */}
            <div className="px-6 pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettingsTab("PROFILE");
                  setSaveMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  settingsTab === "PROFILE"
                    ? "bg-[#4D7762] text-white"
                    : "bg-[#F6F4EF] text-[#5D6E66] hover:bg-[#E9EFEA]"
                }`}
              >
                Profil Nama
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsTab("PIN");
                  setSaveMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  settingsTab === "PIN"
                    ? "bg-[#4D7762] text-white"
                    : "bg-[#F6F4EF] text-[#5D6E66] hover:bg-[#E9EFEA]"
                }`}
              >
                Ganti PIN / Password
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              {settingsTab === "PROFILE" ? (
                <div>
                  <label className="block text-xs font-bold text-[#4C5C54] mb-1.5">
                    Nama Admin / Kasir
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="cth: Kasir Studio Depok"
                    className="w-full px-3.5 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl text-sm font-semibold text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762]"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4C5C54] mb-1.5">
                      PIN Saat Ini
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPin ? "text" : "password"}
                        maxLength={6}
                        required
                        value={currentPin}
                        onChange={(e) =>
                          setCurrentPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Masukkan PIN lama"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl text-sm font-bold tracking-widest text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPin((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D6E66] hover:text-[#162620] cursor-pointer"
                      >
                        {showCurrentPin ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4C5C54] mb-1.5">
                      PIN Baru (6 Digit Angka)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? "text" : "password"}
                        maxLength={6}
                        required
                        value={newPin}
                        onChange={(e) =>
                          setNewPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Masukkan 6 digit PIN baru"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl text-sm font-bold tracking-widest text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D6E66] hover:text-[#162620] cursor-pointer"
                      >
                        {showNewPin ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {saveMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    saveMsg.type === "ok"
                      ? "bg-[#E9EFEA] text-[#254336] border border-[#C8E0D5]"
                      : "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}
                >
                  {saveMsg.type === "ok" && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{saveMsg.text}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F6F4EF] hover:bg-[#E6E2D8] text-xs font-bold text-[#5D6E66] cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#4D7762] hover:bg-[#3B6251] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
