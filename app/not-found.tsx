import Link from "next/link";
import { Sparkles, Home } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#162620] text-[#F6F4EF] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-16 h-16 rounded-3xl bg-[#3B6251]/30 text-[#9DC0A8] flex items-center justify-center mb-5 border border-[#3B6251]/50 shadow-lg">
        <Sparkles className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-[#9DC0A8]/80 text-sm max-w-sm mb-8 leading-relaxed font-medium">
        Kode E-Ticket QR atau halaman yang Anda tuju tidak terdaftar di sistem
        Paranam Lumina Studio.
      </p>

      <Link
        href="/"
        className="bg-[#3B6251] hover:bg-[#497964] active:scale-95 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
      >
        <Home className="w-4 h-4" />
        Kembali ke Jadwal Kelas
      </Link>

      <p className="mt-8 text-[#9DC0A8]/60 text-xs font-semibold">
        Paranam Lumina Studio Depok
      </p>
    </div>
  );
}
