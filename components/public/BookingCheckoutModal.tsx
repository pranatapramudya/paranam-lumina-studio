"use client";

import type React from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { PublicSlotItem, GuestBookingResult } from "@/app/actions/public";
import {
  CheckCircle2,
  Loader2,
  X,
  Phone,
  ArrowRight,
  Timer,
  QrCode,
  AlertCircle,
} from "lucide-react";

export type ModalStep = "FORM" | "PAYMENT" | "TICKET" | "EXPIRED";

interface BookingCheckoutModalProps {
  selectedSlot: PublicSlotItem | null;
  step: ModalStep;
  setStep: (step: ModalStep) => void;
  closeModal: () => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  paymentMethod: "QRIS" | "TRANSFER" | "TUNAI";
  setPaymentMethod: (v: "QRIS" | "TRANSFER" | "TUNAI") => void;
  isSubmitting: boolean;
  errorMsg: string | null;
  activeBooking: GuestBookingResult | null;
  secondsLeft: number;
  origin: string;
  bcaName: string;
  bcaNumber: string;
  formatCountdown: (sec: number) => string;
  handleCheckout: (e: React.FormEvent) => void;
  handleConfirmPaid: () => void;
  handleCancelOrder: () => void;
}

export function BookingCheckoutModal({
  selectedSlot,
  step,
  setStep,
  closeModal,
  name,
  setName,
  phone,
  setPhone,
  paymentMethod,
  setPaymentMethod,
  isSubmitting,
  errorMsg,
  activeBooking,
  secondsLeft,
  origin,
  bcaName,
  bcaNumber,
  formatCountdown,
  handleCheckout,
  handleConfirmPaid,
  handleCancelOrder,
}: BookingCheckoutModalProps) {
  if (!selectedSlot) return null;

  return (
    <div className="fixed inset-0 bg-[#F6F4EF] z-50 flex flex-col overflow-y-auto overscroll-contain">
      {/* Top Bar Fullscreen Sage */}
      <div className="sticky top-0 z-10 w-full bg-[#4D7762] border-b border-[#3B6251] shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white min-w-0">
            <span className="text-xs font-extrabold uppercase tracking-wider truncate">
              {step === "FORM"
                ? "Langkah 1/2 • Data Pemesan"
                : step === "PAYMENT"
                  ? "Langkah 2/2 • Pembayaran"
                  : step === "TICKET"
                    ? "E-Ticket Siap Digunakan"
                    : "Batas Waktu Habis"}
            </span>
          </div>
          <button
            onClick={closeModal}
            aria-label="Tutup Halaman Booking"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#2A5040] hover:bg-[#E9EFEA] text-xs font-extrabold transition-colors touch-manipulation cursor-pointer shrink-0 shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            Tutup
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E6E2D8] relative">
          {/* STEP 1: FORM NAMA + WA + PAYMENT */}
          {step === "FORM" && (
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="flex items-center gap-3 pr-8">
                <img
                  src={selectedSlot.imageUrl}
                  alt={selectedSlot.className}
                  className="w-14 h-14 rounded-2xl object-cover border border-[#E6E2D8] shrink-0"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7762]">
                    {selectedSlot.dayOfWeek}, {selectedSlot.shortDate} •{" "}
                    {selectedSlot.startTime}
                  </span>
                  <h2 className="text-lg font-extrabold text-[#162620] leading-tight">
                    {selectedSlot.className}
                  </h2>
                  <p className="text-xs text-[#5D6E66]">
                    Instruktur {selectedSlot.instructorName}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#4C5C54] block mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCD7CA] rounded-xl text-base sm:text-sm font-semibold text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#4C5C54] block mb-1">
                    Nomor WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#7A8881] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="08xxxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#DCD7CA] rounded-xl text-base sm:text-sm font-semibold text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#4C5C54] block mb-1.5">
                    Pilih Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "QRIS", label: "QRIS", sub: "Scan Instan" },
                      {
                        id: "TRANSFER",
                        label: "Transfer",
                        sub: "BCA Studio",
                      },
                      {
                        id: "TUNAI",
                        label: "Di Studio",
                        sub: "Bayar Kasir",
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            m.id as "QRIS" | "TRANSFER" | "TUNAI",
                          )
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer touch-manipulation ${
                          paymentMethod === m.id
                            ? "bg-[#E9EFEA] border-[#4D7762] ring-1 ring-[#4D7762]"
                            : "bg-white border-[#DCD7CA] hover:border-[#4D7762]/50"
                        }`}
                      >
                        <div className="text-xs font-extrabold text-[#162620]">
                          {m.label}
                        </div>
                        <div className="text-[10px] text-[#5D6E66] mt-0.5">
                          {m.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                  {errorMsg}
                </div>
              )}

              <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-[#7A8881]">
                    Total Bayar
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#162620] whitespace-nowrap">
                    Rp {selectedSlot.price.toLocaleString("id-ID")}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 sm:px-5 py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer touch-manipulation"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  )}
                  {isSubmitting ? "Memproses..." : "Checkout Sekarang"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: KONFIRMASI PAYMENT + COUNTDOWN MUNDUR + CANCEL */}
          {step === "PAYMENT" && activeBooking && (
            <div className="space-y-4">
              <div className="text-center pr-6 pl-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF3EC] text-[#B87A56] border border-[#F2D8C7] text-xs font-extrabold">
                  <Timer className="w-3.5 h-3.5 animate-pulse" />
                  Selesaikan Pembayaran dalam {formatCountdown(secondsLeft)}
                </span>
                <h2 className="text-xl font-extrabold text-[#162620] mt-3">
                  Menunggu Pembayaran
                </h2>
                <p className="text-xs text-[#5D6E66] mt-1">
                  Matras sudah ditahan sementara untuk{" "}
                  <span className="font-bold text-[#162620]">
                    {activeBooking.memberName}
                  </span>
                  .
                </p>
              </div>

              <div className="bg-white border border-[#E6E2D8] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-[#5D6E66] shrink-0">Kelas</span>
                  <span className="font-bold text-[#162620] text-right">
                    {activeBooking.className}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-[#5D6E66] shrink-0">Jadwal</span>
                  <span className="font-bold text-[#162620] text-right whitespace-nowrap">
                    {activeBooking.dayOfWeek}, {activeBooking.shortDate} •{" "}
                    {activeBooking.startTime}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 text-xs">
                  <span className="text-[#5D6E66] shrink-0">Metode</span>
                  <span className="font-bold text-[#4D7762] text-right">
                    {activeBooking.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 pt-2.5 border-t border-dashed border-[#E6E2D8]">
                  <span className="text-xs font-bold text-[#5D6E66] shrink-0">
                    Total Tagihan
                  </span>
                  <span className="text-lg font-black text-[#162620] whitespace-nowrap">
                    Rp {activeBooking.amount.toLocaleString("id-ID")}
                  </span>
                </div>

                {activeBooking.paymentMethod === "QRIS" && (
                  <div className="pt-2 flex flex-col items-center bg-[#F6F4EF] rounded-xl p-3 border border-[#E6E2D8]">
                    <QrCode className="w-20 h-20 text-[#162620] stroke-[1.5]" />
                    <span className="text-[11px] font-bold text-[#162620] mt-1.5">
                      QRIS {bcaName}
                    </span>
                    <span className="text-[10px] text-[#5D6E66]">
                      Scan dengan GoPay, OVO, Dana, atau M-Banking
                    </span>
                  </div>
                )}

                {activeBooking.paymentMethod === "TRANSFER" && (
                  <div className="bg-[#F6F4EF] rounded-xl p-3 border border-[#E6E2D8] text-xs space-y-1">
                    <div className="font-bold text-[#162620]">
                      Bank BCA • {bcaNumber}
                    </div>
                    <div className="text-[#5D6E66]">a.n. {bcaName}</div>
                  </div>
                )}

                {activeBooking.paymentMethod === "TUNAI" && (
                  <div className="bg-[#F6F4EF] rounded-xl p-3 border border-[#E6E2D8] text-xs text-[#5D6E66]">
                    Silakan lakukan pembayaran langsung di meja studio sebelum
                    kelas dimulai, lalu klik konfirmasi di bawah.
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleConfirmPaid}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer touch-manipulation"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>Konfirmasi & Ambil E-Ticket</span>
                </button>

                <button
                  onClick={handleCancelOrder}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-transparent hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-colors cursor-pointer touch-manipulation"
                >
                  Batalkan Pesanan (Kembalikan Matras)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: E-TICKET MUNCUL SETELAH BAYAR */}
          {step === "TICKET" && activeBooking && (
            <div className="text-center space-y-4 py-1">
              <div className="w-12 h-12 rounded-full bg-[#E9EFEA] text-[#4D7762] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3B6251] bg-[#E9EFEA] px-2.5 py-1 rounded-full">
                  Pembayaran Dikonfirmasi
                </span>
                <h2 className="text-xl font-extrabold text-[#162620] mt-2">
                  E-Ticket Kamu Siap!
                </h2>
              </div>

              <div className="bg-white border border-[#E6E2D8] rounded-2xl p-4 text-left space-y-3 shadow-sm">
                <div className="flex justify-between items-start border-b border-dashed border-[#DCD7CA] pb-3 gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#4D7762]">
                      {activeBooking.dayOfWeek}, {activeBooking.shortDate} •{" "}
                      {activeBooking.startTime}
                    </p>
                    <h3 className="text-base font-extrabold text-[#162620]">
                      {activeBooking.className}
                    </h3>
                    <p className="text-xs text-[#5D6E66]">
                      Instruktur: {activeBooking.instructorName}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#4D7762] text-white text-[10px] font-black shrink-0">
                    {activeBooking.bookingCode}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white p-2 rounded-xl border border-[#E6E2D8] shrink-0 flex items-center justify-center">
                    <QRCode
                      value={`${origin}/verify/${activeBooking.bookingCode}`}
                      size={80}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-extrabold text-[#162620]">
                      {activeBooking.memberName}
                    </div>
                    <div className="text-[#5D6E66]">
                      {activeBooking.phoneNumber}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded bg-[#E9EFEA] text-[#254336] text-[10px] font-bold">
                      LUNAS • Rp {activeBooking.amount.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href={`/tiket?wa=${encodeURIComponent(activeBooking.phoneNumber)}`}
                className="w-full py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all touch-manipulation"
              >
                Simpan & Buka E-Ticket Saya
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* STEP EXPIRED */}
          {step === "EXPIRED" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#162620]">
                  Batas Waktu Habis
                </h2>
                <p className="text-xs text-[#5D6E66] mt-1">
                  Tenggat waktu 15 menit sudah berakhir. Slot matras otomatis
                  dikembalikan agar bisa dipesan murid lain.
                </p>
              </div>
              <button
                onClick={() => setStep("FORM")}
                className="w-full py-3 bg-[#4D7762] text-white font-bold text-sm rounded-xl cursor-pointer touch-manipulation"
              >
                Booking Ulang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
