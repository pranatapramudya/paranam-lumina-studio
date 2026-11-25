"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PARANAM_SYSTEM_ERROR]:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#162620] text-[#F6F4EF] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-5 shadow-lg border border-rose-500/20">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight mb-2">
        Terjadi Kendala Sistem
      </h2>
      <p className="text-[#9DC0A8]/80 text-sm max-w-sm mb-8 leading-relaxed font-medium">
        Koneksi database atau sesi server mengalami gangguan sementara. Silakan
        coba muat ulang halaman.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => reset()}
          className="w-full bg-[#3B6251] hover:bg-[#497964] active:scale-95 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>

        <Link
          href="/"
          className="w-full bg-white/10 hover:bg-white/15 active:scale-95 text-[#F6F4EF] font-bold py-3.5 px-6 rounded-2xl border border-white/15 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      <p className="mt-8 text-[#9DC0A8]/60 text-xs font-semibold">
        Paranam Lumina Studio Depok
      </p>
    </div>
  );
}
