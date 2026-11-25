"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PARANAM_ADMIN_ERROR]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
        Gagal Memuat Data Kasir / Dashboard
      </h3>
      <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed font-medium">
        Tidak dapat menarik sinkronisasi data transaksi atau member. Periksa
        koneksi internet Anda.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>

        <Link
          href="/2026/dashboard"
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold py-2.5 px-5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
