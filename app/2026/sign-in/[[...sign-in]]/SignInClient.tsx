"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAdminWithPin, resetAdminPinWithPhone } from "@/app/actions/auth";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function AdminSignInPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lupa PIN modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [resetNewPin, setResetNewPin] = useState("");
  const [showResetPin, setShowResetPin] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customPin?: string) => {
    if (e) e.preventDefault();
    const pinToSubmit = customPin || pin;
    if (!pinToSubmit || pinToSubmit.length < 4) {
      setError("Masukkan PIN minimal 4-6 digit.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await loginAdminWithPin(pinToSubmit);
      if (res.success) {
        window.location.href = "/2026/dashboard";
      } else {
        setError(res.error || "PIN tidak valid.");
        setIsLoading(false);
      }
    } catch {
      setError("Gagal masuk. Coba lagi.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickPin: string) => {
    setPin(quickPin);
    handleSubmit(undefined, quickPin);
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);
    const res = await resetAdminPinWithPhone(waPhone, resetNewPin);
    setResetLoading(false);
    if (res.success) {
      setResetMsg({
        type: "ok",
        text: "PIN berhasil direset! Silakan masuk menggunakan PIN baru Anda.",
      });
      setPin(resetNewPin);
      setTimeout(() => {
        setForgotOpen(false);
        setResetMsg(null);
        setWaPhone("");
        setResetNewPin("");
      }, 1500);
    } else {
      setResetMsg({ type: "err", text: res.error || "Gagal mereset PIN." });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[100dvh] w-full font-sans bg-[#F6F4EF]">
      {/* Sisi Kiri: Branding Paranam Lumina (Sage Pastel Cerah — Tidak Gelap) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:p-16 bg-[#C8E0D5] text-[#1D3D30] relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#A8C8B8]">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#4D7762]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2A5040] hover:text-[#1D3D30] bg-white/60 hover:bg-white px-3.5 py-2 rounded-full mb-6 transition-all border border-[#A8C8B8]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Jadwal Publik
          </Link>

          <div className="block mb-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4D7762] text-white text-xs font-bold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Admin / Kasir
            </span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black mb-3 tracking-tight text-[#1D3D30]">
            PARANAM LUMINA
          </h1>
          <p className="text-lg lg:text-xl font-bold mb-4 text-[#3B6251]">
            Panel Operasional & Kasir Studio
          </p>
          <p className="text-sm lg:text-base text-[#2A5040]/85 max-w-md leading-relaxed">
            Kelola jadwal kelas harian, kuota matras, konfirmasi pembayaran
            tamu, serta scan QR E-Ticket saat check-in di studio.
          </p>

          <div className="mt-10 pt-8 border-t border-[#A8C8B8] flex items-center gap-6 text-xs font-semibold text-[#3B6251]">
            <span>© {new Date().getFullYear()} Paranam Lumina Depok</span>
            <span>•</span>
            <span>Akses Tunggal PIN</span>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: PIN Login */}
      <div className="w-full lg:w-1/2 flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#F6F4EF]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E2D8] p-8 shadow-xl shadow-[#4D7762]/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E9EFEA] border border-[#C8E0D5] flex items-center justify-center text-[#4D7762]">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1D3D30]">
                Masuk Admin / Kasir
              </h2>
              <p className="text-xs text-[#5D6E66]">
                Masukkan 6 digit PIN akses studio
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4C5C54]">
                  PIN Akses Studio
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-bold text-[#4D7762] hover:text-[#3B6251] hover:underline cursor-pointer"
                >
                  Lupa PIN / Password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/[^0-9]/g, ""));
                    setError(null);
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3.5 pl-11 pr-11 bg-[#F6F4EF] border border-[#DCD7CA] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4D7762] focus:bg-white transition-all text-[#162620] placeholder:tracking-normal placeholder:text-sm placeholder:font-normal placeholder:text-[#7A8881]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  aria-label={showPin ? "Sembunyikan PIN" : "Lihat PIN"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#5D6E66] hover:text-[#1D3D30] hover:bg-[#E9EFEA] transition-colors cursor-pointer"
                >
                  {showPin ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="w-full py-3.5 rounded-2xl bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-sm shadow-md shadow-[#4D7762]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Memverifikasi..." : "Masuk ke Dashboard"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal Lupa PIN / Password */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162620]/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E2D8] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#C8E0D5] border-b border-[#A8C8B8] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4D7762] text-white flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1D3D30]">
                    Reset PIN Admin / Kasir
                  </h3>
                  <p className="text-[11px] text-[#3B6251]">
                    Verifikasi nomor WhatsApp studio terdaftar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="p-1.5 rounded-lg text-[#2A5040] hover:bg-white/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4C5C54] mb-1.5">
                  Nomor WhatsApp Admin / Studio Terdaftar
                </label>
                <input
                  type="tel"
                  required
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="cth: 081111111111"
                  className="w-full px-3.5 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl text-sm font-semibold text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4C5C54] mb-1.5">
                  PIN Baru (6 Digit Angka)
                </label>
                <div className="relative">
                  <input
                    type={showResetPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={resetNewPin}
                    onChange={(e) =>
                      setResetNewPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Masukkan 6 digit PIN baru"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl text-sm font-bold tracking-widest text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPin((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5D6E66] hover:text-[#162620] cursor-pointer"
                  >
                    {showResetPin ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {resetMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    resetMsg.type === "ok"
                      ? "bg-[#E9EFEA] text-[#254336] border border-[#C8E0D5]"
                      : "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}
                >
                  {resetMsg.type === "ok" && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{resetMsg.text}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F6F4EF] hover:bg-[#E6E2D8] text-xs font-bold text-[#5D6E66] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#4D7762] hover:bg-[#3B6251] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Reset PIN Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
