"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function TiketError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#F6F4EF] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-5 border border-rose-200">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-[#162620] mb-2">
        Gagal Memuat E-Ticket
      </h2>
      <p className="text-sm text-[#5D6E66] max-w-sm mb-6">
        Koneksi ke server studio sempat terganggu. Silakan coba muat ulang.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#E6E2D8] text-[#162620] rounded-xl text-xs font-bold hover:bg-[#E9EFEA]"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Jadwal
        </Link>
      </div>
    </div>
  );
}
