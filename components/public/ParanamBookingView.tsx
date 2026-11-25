"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  PublicSlotItem,
  StudioInfo,
  GuestBookingResult,
  createGuestBooking,
  confirmGuestPayment,
  cancelGuestBooking,
} from "@/app/actions/public";
import { useResponsivePagination } from "@/hooks/useResponsivePagination";
import { Pagination } from "@/components/ui/Pagination";
import {
  Clock,
  User,
  Ticket,
  CheckCircle2,
  Loader2,
  X,
  Phone,
  ArrowRight,
  Timer,
  QrCode,
  CalendarCheck2,
  AlertCircle,
  Search,
  SlidersHorizontal,
  CalendarDays,
} from "lucide-react";

type ModalStep = "FORM" | "PAYMENT" | "TICKET" | "EXPIRED";

interface WeekDayOption {
  dayName: string;
  shortLabel: string;
  dateLabel: string;
  isToday: boolean;
  classCount: number;
}

const ORDERED_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;
const SHORT_DAY_MAP: Record<string, string> = {
  Senin: "Sen",
  Selasa: "Sel",
  Rabu: "Rab",
  Kamis: "Kam",
  Jumat: "Jum",
  Sabtu: "Sab",
  Minggu: "Min",
};

export default function ParanamBookingView({
  initialSlots,
  studioInfo,
}: {
  initialSlots: PublicSlotItem[];
  studioInfo?: StudioInfo;
}) {
  const [slots, setSlots] = useState<PublicSlotItem[]>(initialSlots);
  const [selectedInstructor, setSelectedInstructor] = useState("Semua");
  const [selectedDay, setSelectedDay] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedSlot, setSelectedSlot] = useState<PublicSlotItem | null>(null);
  const [step, setStep] = useState<ModalStep>("FORM");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "QRIS" | "TRANSFER" | "TUNAI"
  >("QRIS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active booking + countdown state
  const [activeBooking, setActiveBooking] = useState<GuestBookingResult | null>(
    null,
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
  }, []);

  // Lock background scroll saat fullscreen modal booking aktif
  useEffect(() => {
    if (selectedSlot) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedSlot]);

  // Countdown tick when in PAYMENT step
  useEffect(() => {
    if (step !== "PAYMENT" || !activeBooking?.expiresAtIso) return;

    const updateTimer = () => {
      const diff = Math.floor(
        (new Date(activeBooking.expiresAtIso).getTime() - Date.now()) / 1000,
      );
      if (diff <= 0) {
        setSecondsLeft(0);
        setStep("EXPIRED");
        if (selectedSlot) {
          setSlots((prev) =>
            prev.map((s) =>
              s.id === selectedSlot.id
                ? {
                    ...s,
                    currentBookings: Math.max(0, s.currentBookings - 1),
                    isFull: Math.max(0, s.currentBookings - 1) >= s.maxCapacity,
                  }
                : s,
            ),
          );
        }
      } else {
        setSecondsLeft(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [step, activeBooking, selectedSlot]);

  // Hitung tanggal otomatis untuk Senin - Minggu minggu berjalan (WIB / Asia/Jakarta)
  const weekDays = useMemo<WeekDayOption[]>(() => {
    const jakartaNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );
    jakartaNow.setHours(0, 0, 0, 0);

    // 7 hari ke depan mulai dari HARI INI (tidak ada hari ke belakang yang sudah terlewat)
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(jakartaNow);
      d.setDate(jakartaNow.getDate() + idx);
      const dayName = d.toLocaleDateString("id-ID", { weekday: "long" });
      const dateLabel = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      const isToday = idx === 0;
      const classCount = slots.filter(
        (s) =>
          s.shortDate === dateLabel &&
          s.dayOfWeek.toLowerCase() === dayName.toLowerCase(),
      ).length;

      return {
        dayName,
        shortLabel: SHORT_DAY_MAP[dayName] || dayName.slice(0, 3),
        dateLabel,
        isToday,
        classCount,
      };
    });
  }, [slots]);

  const instructors = useMemo(() => {
    const names = Array.from(
      new Set(slots.map((s) => s.instructorName).filter(Boolean)),
    );
    return ["Semua", ...names];
  }, [slots]);

  const filteredSlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return slots.filter((s) => {
      const matchInst =
        selectedInstructor === "Semua" ||
        s.instructorName === selectedInstructor;
      const matchDay =
        selectedDay === "Semua" ||
        s.dayOfWeek.toLowerCase() === selectedDay.toLowerCase();
      const matchSearch =
        !q ||
        s.className.toLowerCase().includes(q) ||
        s.instructorName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchInst && matchDay && matchSearch;
    });
  }, [slots, selectedInstructor, selectedDay, searchQuery]);

  // SOP Fundamental: maks 5 item di mobile (<768px), 10 item di desktop (>=768px) per halaman
  const {
    itemsPerPage,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
  } = useResponsivePagination(filteredSlots);

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setCurrentPage(1);
  };

  const handleInstructorChange = (inst: string) => {
    setSelectedInstructor(inst);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const openModal = (slot: PublicSlotItem) => {
    setSelectedSlot(slot);
    setStep("FORM");
    setErrorMsg(null);
    setActiveBooking(null);
  };

  const closeModal = () => {
    setSelectedSlot(null);
    setErrorMsg(null);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createGuestBooking({
      slotId: selectedSlot.id,
      name,
      phoneNumber: phone,
      paymentMethod,
    });

    setIsSubmitting(false);

    if (!res.success || !res.booking) {
      setErrorMsg(res.error || "Gagal memproses pesanan.");
      return;
    }

    setActiveBooking(res.booking);
    setStep("PAYMENT");
    try {
      localStorage.setItem("paranam_guest_wa", phone);
    } catch {}

    setSlots((prev) =>
      prev.map((s) =>
        s.id === selectedSlot.id
          ? {
              ...s,
              currentBookings: s.currentBookings + 1,
              isFull: s.currentBookings + 1 >= s.maxCapacity,
            }
          : s,
      ),
    );
  };

  const handleConfirmPaid = async () => {
    if (!activeBooking) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await confirmGuestPayment(
      activeBooking.id,
      activeBooking.phoneNumber,
    );
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Gagal konfirmasi pembayaran.");
      return;
    }

    setActiveBooking({ ...activeBooking, status: "PAID" });
    setStep("TICKET");
  };

  const handleCancelOrder = async () => {
    if (!activeBooking) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await cancelGuestBooking(
      activeBooking.id,
      activeBooking.phoneNumber,
    );
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Gagal membatalkan pesanan.");
      return;
    }

    if (selectedSlot) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === selectedSlot.id
            ? {
                ...s,
                currentBookings: Math.max(0, s.currentBookings - 1),
                isFull: Math.max(0, s.currentBookings - 1) >= s.maxCapacity,
              }
            : s,
        ),
      );
    }

    closeModal();
  };

  const bcaNumber = studioInfo?.bcaAccountNumber || "7140982311";
  const bcaName = studioInfo?.bcaAccountName || "Paranam Lumina Studio";
  const studioAddress = studioInfo?.address || "Depok, Jawa Barat";

  return (
    <div className="min-h-[100dvh] w-full bg-[#F6F4EF] text-[#162620] font-sans flex flex-col selection:bg-[#527C66]/20 overflow-x-hidden">
      {/* ===== NAVBAR SAGE CERAH + TEKS BOLD PUTIH TERANG ===== */}
      <nav className="sticky top-0 z-40 w-full bg-[#4D7762] border-b border-[#3B6251] shadow-md pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-black tracking-[0.14em] text-white uppercase truncate drop-shadow-xs">
              {studioInfo?.studioName || "Paranam Lumina Studio"}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-white/95 tracking-wide truncate">
              {studioAddress} • Yoga, Pilates & Sound Healing
            </span>
          </div>

          <Link
            href="/tiket"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#E9EFEA] text-[#2A5040] text-xs font-extrabold transition-all shadow-sm active:scale-[0.97] shrink-0 touch-manipulation"
          >
            <Ticket className="w-3.5 h-3.5 text-[#4D7762]" />
            E-Ticket Saya
          </Link>
        </div>
      </nav>

      {/* ===== EDITORIAL HEADER & MODERN FILTER ===== */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#E6E2D8]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#3B6251] bg-[#E9EFEA] px-3 py-1 rounded-full mb-3">
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#4D7762]" /> Booking
              Langsung Tanpa Daftar
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#162620]">
              Jadwal Kelas Studio
            </h1>
            <p className="text-sm text-[#5D6E66] mt-1.5 max-w-2xl">
              Cek ketersediaan matras tiap sesi, pilih hari & instruktur
              favoritmu, lalu selesaikan pembayaran untuk mendapatkan E-Ticket.
            </p>
          </div>
        </div>

        {/* Alur Cara Booking Mudah (Clean 3 Langkah) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {[
            {
              step: "1",
              title: "Pilih Kelas & Hari",
              desc: "Cek sisa matras & instruktur sesuai jadwalmu.",
            },
            {
              step: "2",
              title: "Isi Nama & WhatsApp",
              desc: "Tanpa login atau buat akun, cukup 10 detik.",
            },
            {
              step: "3",
              title: "Bayar & Terima E-Ticket",
              desc: "QR Code aktif untuk scan masuk kelas di studio.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-center gap-3 bg-white/90 rounded-2xl border border-[#E6E2D8] px-3.5 py-2.5 shadow-2xs"
            >
              <div className="w-7 h-7 rounded-xl bg-[#E9EFEA] text-[#4D7762] font-black text-xs flex items-center justify-center shrink-0 border border-[#C8E0D5]">
                {item.step}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#162620] leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-[#5D6E66] truncate mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modern Filter Card (Anti Mepet / Anti Overflow di Mobile & Desktop) */}
        <div className="bg-white rounded-2xl border border-[#E6E2D8] p-3.5 sm:p-4 shadow-sm space-y-4">
          {/* Row 1: Jadwal Hari Senin - Minggu (Otomatis Tanggal) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#4C5C54]">
                <CalendarDays className="w-3.5 h-3.5 text-[#4D7762]" />
                Pilih Hari (7 Hari ke Depan)
              </span>
              {selectedDay !== "Semua" && (
                <button
                  type="button"
                  onClick={() => handleDayChange("Semua")}
                  className="text-[11px] font-bold text-[#4D7762] hover:underline cursor-pointer"
                >
                  Tampilkan Semua Hari
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {/* Pill Semua Hari */}
              <button
                type="button"
                onClick={() => handleDayChange("Semua")}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                  selectedDay === "Semua"
                    ? "bg-[#4D7762] border-[#4D7762] text-white shadow-sm"
                    : "bg-[#F6F4EF] border-[#E6E2D8] text-[#162620] hover:border-[#4D7762]/50"
                }`}
              >
                <span className="text-[11px] font-extrabold leading-tight">
                  Semua
                </span>
                <span
                  className={`text-[10px] font-semibold mt-0.5 ${
                    selectedDay === "Semua" ? "text-white/90" : "text-[#5D6E66]"
                  }`}
                >
                  {slots.length} Kelas
                </span>
              </button>

              {/* 7 Hari Senin - Minggu + Tanggal Otomatis */}
              {weekDays.map((d) => {
                const active = selectedDay === d.dayName;
                return (
                  <button
                    key={d.dayName}
                    type="button"
                    onClick={() => handleDayChange(d.dayName)}
                    className={`relative flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                      active
                        ? "bg-[#4D7762] border-[#4D7762] text-white shadow-sm"
                        : d.classCount > 0
                          ? "bg-white border-[#DCD7CA] text-[#162620] hover:border-[#4D7762]"
                          : "bg-[#FAF9F6] border-[#EDEAE2] text-[#7A8881] hover:border-[#DCD7CA]"
                    }`}
                  >
                    {d.isToday && (
                      <span
                        className={`text-[8px] font-black uppercase tracking-wider px-1.5 rounded-full mb-0.5 ${
                          active
                            ? "bg-white/25 text-white"
                            : "bg-[#E9EFEA] text-[#3B6251]"
                        }`}
                      >
                        Hari Ini
                      </span>
                    )}
                    <span className="text-[11px] font-extrabold leading-tight sm:hidden">
                      {d.shortLabel}
                    </span>
                    <span className="hidden sm:inline text-[11px] font-extrabold leading-tight">
                      {d.dayName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold mt-0.5 ${
                        active ? "text-white/90" : "text-[#5D6E66]"
                      }`}
                    >
                      {d.dateLabel}
                    </span>
                    {d.classCount > 0 && (
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full ${
                          active ? "bg-white" : "bg-[#4D7762]"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Search + Instructor Filter Pills (semua ukuran layar, scrollable) */}
          <div className="pt-3 border-t border-[#F0EDE5] flex flex-col gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#7A8881] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Cari kelas atau instruktur..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl text-sm font-semibold text-[#162620] placeholder:text-[#7A8881] focus:outline-none focus:ring-2 focus:ring-[#4D7762] focus:bg-white"
              />
            </div>

            {/* Instructor Filter — scrollable pills, semua ukuran layar (tidak ada select dropdown) */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5D6E66] uppercase tracking-wider shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#4D7762]" />
                Instruktur:
              </span>
              {/* Pills scrollable horizontal */}
              <div
                className="flex-1 overflow-x-auto scrollbar-none"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex items-center gap-1.5 w-max pr-2">
                  {instructors.map((inst) => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => handleInstructorChange(inst)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer touch-manipulation shrink-0 ${
                        selectedInstructor === inst
                          ? "bg-[#4D7762] text-white shadow-sm"
                          : "bg-[#F6F4EF] text-[#4C5C54] border border-[#E6E2D8] hover:border-[#4D7762] active:bg-[#E9EFEA]"
                      }`}
                    >
                      {inst === "Semua" ? "Semua" : inst}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== CLASS CARDS GRID + RESPONSIVE PAGINATION ===== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredSlots.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#E6E2D8]">
            <CalendarDays className="w-10 h-10 text-[#4D7762]/50 mx-auto mb-3" />
            <p className="text-sm font-extrabold text-[#162620]">
              {selectedDay !== "Semua"
                ? `Belum ada jadwal kelas di hari ${selectedDay}.`
                : "Belum ada kelas yang cocok dengan filter."}
            </p>
            <p className="text-xs text-[#5D6E66] mt-1">
              Silakan pilih hari lain atau tampilkan semua jadwal minggu ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDay("Semua");
                setSelectedInstructor("Semua");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#4D7762] hover:bg-[#3E6250] text-white text-xs font-bold cursor-pointer touch-manipulation"
            >
              Tampilkan Semua Jadwal
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-[#5D6E66] font-medium mb-3 px-0.5">
              <span>
                Menampilkan{" "}
                <strong className="text-[#162620]">
                  {paginatedData.length}
                </strong>{" "}
                dari{" "}
                <strong className="text-[#162620]">
                  {filteredSlots.length}
                </strong>{" "}
                kelas
              </span>
              <span className="text-[11px] bg-[#E9EFEA] text-[#3B6251] font-bold px-2.5 py-0.5 rounded-full">
                Maks. {itemsPerPage}/halaman
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedData.map((slot) => {
                const remaining = Math.max(
                  0,
                  slot.maxCapacity - slot.currentBookings,
                );
                const fillPercent = Math.min(
                  100,
                  Math.round((slot.currentBookings / slot.maxCapacity) * 100),
                );

                return (
                  <div
                    key={slot.id}
                    className={`bg-white rounded-[1.5rem] border border-[#E6E2D8] overflow-hidden flex flex-col transition-all duration-200 ${
                      slot.isFull
                        ? "opacity-75"
                        : "hover:border-[#4D7762]/60 hover:shadow-[0_12px_30px_rgba(22,38,32,0.07)]"
                    }`}
                  >
                    {/* Photo Banner */}
                    <div className="relative aspect-[16/10] w-full bg-[#E9EFEA] overflow-hidden">
                      <img
                        src={slot.imageUrl}
                        alt={slot.className}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/classes/yoga.jpg";
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#162620]/70 via-transparent to-black/10" />

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F4EF]/95 backdrop-blur-sm text-[#162620] text-[11px] font-bold shadow-sm">
                          {slot.dayOfWeek}, {slot.shortDate}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm backdrop-blur-sm ${
                            slot.isFull
                              ? "bg-[#162620]/90 text-white"
                              : remaining <= 3
                                ? "bg-[#B87A56] text-white"
                                : "bg-[#E9EFEA]/95 text-[#254336]"
                          }`}
                        >
                          {slot.isFull
                            ? "KUOTA PENUH"
                            : `Sisa ${remaining}/${slot.maxCapacity} Matras`}
                        </span>
                      </div>

                      {/* Time bottom-left */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#C5DEC9]" />
                        {slot.startTime} – {slot.endTime} WIB
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7762]">
                          {slot.category}
                        </span>
                        <h2 className="text-lg font-extrabold text-[#162620] leading-snug mt-0.5">
                          {slot.className}
                        </h2>
                        <p className="text-xs font-semibold text-[#5D6E66] mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#4D7762]" />
                          Instruktur:{" "}
                          <span className="text-[#162620]">
                            {slot.instructorName}
                          </span>
                        </p>

                        {/* Visual Quota Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-semibold text-[#7A8881] mb-1">
                            <span>
                              Terisi {slot.currentBookings} dari{" "}
                              {slot.maxCapacity} matras
                            </span>
                            <span>{fillPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#EFECE4] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                slot.isFull ? "bg-[#B87A56]" : "bg-[#4D7762]"
                              }`}
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Price + Action */}
                      <div className="pt-3 border-t border-[#F0EDE5] flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A8881]">
                            Tarif Sesi
                          </div>
                          <div className="text-base font-black text-[#162620]">
                            Rp {slot.price.toLocaleString("id-ID")}
                          </div>
                        </div>

                        <button
                          onClick={() => openModal(slot)}
                          disabled={slot.isFull}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all touch-manipulation ${
                            slot.isFull
                              ? "bg-[#EFECE4] text-[#9BA6A0] cursor-not-allowed"
                              : "bg-[#4D7762] hover:bg-[#3B6251] text-white shadow-sm active:scale-[0.97] cursor-pointer"
                          }`}
                        >
                          {slot.isFull ? "Penuh" : "Booking Kelas"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredSlots.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </main>

      {/* ===== FOOTER SUBTLE (TANPA PORTAL ADMIN) ===== */}
      <footer className="border-t border-[#E6E2D8] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 text-center bg-[#F1EEE7]">
        <p className="text-xs text-[#6B7A72] font-medium">
          © {new Date().getFullYear()}{" "}
          {studioInfo?.studioName || "Paranam Lumina Studio"} • {studioAddress}
        </p>
      </footer>

      {/* ===== FULLSCREEN DINAMIS: CHECKOUT -> PAYMENT -> E-TICKET ===== */}
      {selectedSlot && (
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
                            onClick={() => setPaymentMethod(m.id as any)}
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

                  <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-[#7A8881]">
                        Total Bayar
                      </div>
                      <div className="text-lg font-black text-[#162620]">
                        Rp {selectedSlot.price.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer touch-manipulation"
                    >
                      {isSubmitting && (
                        <Loader2 className="w-4 h-4 animate-spin" />
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
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5D6E66]">Kelas</span>
                      <span className="font-bold text-[#162620]">
                        {activeBooking.className}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5D6E66]">Jadwal</span>
                      <span className="font-bold text-[#162620]">
                        {activeBooking.dayOfWeek}, {activeBooking.shortDate} •{" "}
                        {activeBooking.startTime}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5D6E66]">Metode</span>
                      <span className="font-bold text-[#4D7762]">
                        {activeBooking.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-[#E6E2D8]">
                      <span className="text-xs font-bold text-[#5D6E66]">
                        Total Tagihan
                      </span>
                      <span className="text-lg font-black text-[#162620]">
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
                        Silakan lakukan pembayaran langsung di meja studio
                        sebelum kelas dimulai, lalu klik konfirmasi di bawah.
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
                      className="w-full py-3.5 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer touch-manipulation"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Konfirmasi Sudah Bayar & Ambil E-Ticket
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
                          LUNAS • Rp{" "}
                          {activeBooking.amount.toLocaleString("id-ID")}
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
                      Tenggat waktu 15 menit sudah berakhir. Slot matras
                      otomatis dikembalikan agar bisa dipesan murid lain.
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
      )}
    </div>
  );
}
