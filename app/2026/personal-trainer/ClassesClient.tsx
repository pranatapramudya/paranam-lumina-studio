"use client";

import { useState, useRef, useCallback } from "react";
import { AdminToast, ToastType } from "@/components/admin/AdminToast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useResponsivePagination } from "@/hooks/useResponsivePagination";
import { Pagination } from "@/components/ui/Pagination";
import {
  confirmBookingPayment,
  markBookingAttended,
  cancelAdminBooking,
  createClassSchedule,
  deleteClassSchedule,
  updateClassSchedule,
  cloneNextWeekSchedules,
} from "@/app/actions/admin";
import {
  CheckCircle2,
  Loader2,
  CalendarClock,
  Trash2,
  Printer,
  Plus,
  UserCheck,
  XCircle,
  Users,
  Pencil,
  Search,
  Upload,
  X,
  ImageIcon,
  CopyPlus,
  Clock,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BookingItem {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  className: string;
  instructor: string;
  scheduleDateIso: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  attendanceStatus: string;
  createdAtIso: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  category: string;
  instructor: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  price: number;
  maxCapacity: number;
  bookedCount: number;
  room: string;
  instructorPhoto?: string;
}

const METHOD_LABEL: Record<string, string> = {
  QRIS_MANUAL: "QRIS",
  TRANSFER_MANUAL: "Transfer BCA",
  CASH_STUDIO: "Tunai Studio",
  PACKAGE_CREDIT: "Credit",
};

const HOURS_24 = Array.from({ length: 16 }, (_, i) =>
  String(i + 6).padStart(2, "0"),
); // 06..21
const MINUTES_QUICK = ["00", "15", "30", "45"];

function ModernTime24Picker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hh, mm] = (value || "08:00").split(":");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#F6F4EF] hover:bg-[#E9EFEA]/60 border border-[#DCD7CA] rounded-xl font-bold text-[#162620] transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#4D7762]" />
          <span>
            {hh}:{mm}
          </span>
        </span>
        <span className="text-[10px] font-extrabold text-[#4D7762] bg-[#E9EFEA] px-1.5 py-0.5 rounded-md">
          WIB
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-[#E6E2D8] rounded-2xl shadow-xl p-3 z-40 space-y-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5D6E66] mb-1.5">
                Pilih Jam (24 Jam)
              </p>
              <div className="grid grid-cols-4 gap-1">
                {HOURS_24.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange(`${h}:${mm || "00"}`)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      hh === h
                        ? "bg-[#4D7762] text-white shadow-xs"
                        : "bg-[#F6F4EF] text-[#162620] hover:bg-[#E9EFEA]"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#F0EDE5]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5D6E66] mb-1.5">
                Pilih Menit
              </p>
              <div className="grid grid-cols-4 gap-1">
                {MINUTES_QUICK.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onChange(`${hh || "08"}:${m}`);
                      setOpen(false);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      mm === m
                        ? "bg-[#4D7762] text-white shadow-xs"
                        : "bg-[#F6F4EF] text-[#162620] hover:bg-[#E9EFEA]"
                    }`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const DAY_OPTIONS = [
  { label: "Senin", jsDay: 1 },
  { label: "Selasa", jsDay: 2 },
  { label: "Rabu", jsDay: 3 },
  { label: "Kamis", jsDay: 4 },
  { label: "Jumat", jsDay: 5 },
  { label: "Sabtu", jsDay: 6 },
  { label: "Minggu", jsDay: 0 },
];

function getNextDateForJsDay(targetJsDay: number): string {
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const currentJsDay = nowWib.getUTCDay();
  const diff = (targetJsDay - currentJsDay + 7) % 7;
  const target = new Date(nowWib.getTime() + diff * 24 * 60 * 60 * 1000);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(
    target.getUTCDate(),
  ).padStart(2, "0")}`;
}

// ── Image compression via Canvas ──────────────────────────────────────────────
async function compressImage(
  file: File,
  maxPx = 800,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ClassesClient({
  initialBookings,
  initialSchedules,
}: {
  initialBookings: BookingItem[];
  initialSchedules: ScheduleItem[];
}) {
  const [activeTab, setActiveTab] = useState<"BOOKINGS" | "JADWAL">("BOOKINGS");
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "PAID" | "ATTENDED"
  >("ALL");
  const [filterInstructor, setFilterInstructor] = useState("ALL");
  const [bookingSearch, setBookingSearch] = useState("");
  const [jadwalSearch, setJadwalSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });

  // Form state (shared tambah + edit)
  const todayStr = new Date().toISOString().split("T")[0];
  const [editingId, setEditingId] = useState<string | null>(null); // null = tambah baru
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Beginner Friendly");
  const [instructor, setInstructor] = useState("");
  const [dateStr, setDateStr] = useState(todayStr);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:15");
  const [price, setPrice] = useState(90000);
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const formatWibDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });

  const formatWibTime = (t: string) => `${t} WIB`;

  // ── Booking actions ──────────────────────────────────────────────────────────
  const handleConfirmPay = async (id: string) => {
    setProcessingId(id);
    const res = await confirmBookingPayment(id);
    setProcessingId(null);
    if (res.success) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, paymentStatus: "PAID" } : b)),
      );
      showToast("Pembayaran dikonfirmasi Lunas.", "success");
    } else showToast(res.error || "Gagal konfirmasi", "error");
  };

  const handleMarkAttended = async (id: string) => {
    setProcessingId(id);
    const res = await markBookingAttended(id);
    setProcessingId(null);
    if (res.success) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, attendanceStatus: "ATTENDED", paymentStatus: "PAID" }
            : b,
        ),
      );
      showToast("Murid ditandai Hadir.", "success");
    } else showToast(res.error || "Gagal update kehadiran", "error");
  };

  const handleCancelBooking = async (id: string) => {
    setProcessingId(id);
    const res = await cancelAdminBooking(id);
    setProcessingId(null);
    if (res.success) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, attendanceStatus: "CANCELLED", paymentStatus: "REJECTED" }
            : b,
        ),
      );
      showToast("Booking dibatalkan.", "success");
    } else showToast(res.error || "Gagal membatalkan", "error");
  };

  // ── Instructor unique list (real dari seluruh jadwal & booking di DB) ───────
  const bookingInstructors = [
    ...new Set([
      ...schedules.map((s) => s.instructor).filter(Boolean),
      ...bookings.map((b) => b.instructor).filter(Boolean),
    ]),
  ];

  // ── Filtered bookings ────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter((b) => {
    const statusOk =
      filterStatus === "ALL"
        ? true
        : filterStatus === "PENDING"
          ? b.paymentStatus === "PENDING" && b.attendanceStatus !== "CANCELLED"
          : filterStatus === "PAID"
            ? b.paymentStatus === "PAID" && b.attendanceStatus !== "CANCELLED"
            : b.attendanceStatus === "ATTENDED";
    const instrOk =
      filterInstructor === "ALL" || b.instructor === filterInstructor;
    const q = bookingSearch.toLowerCase();
    const searchOk =
      !q ||
      b.customerName.toLowerCase().includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.className.toLowerCase().includes(q) ||
      b.instructor.toLowerCase().includes(q) ||
      b.customerPhone.includes(q);
    return statusOk && instrOk && searchOk;
  });

  const {
    itemsPerPage,
    currentPage,
    setCurrentPage,
    paginatedData: paginatedBookings,
    totalPages,
  } = useResponsivePagination(filteredBookings);

  // ── Filtered schedules ───────────────────────────────────────────────────────
  const filteredSchedules = schedules.filter((s) => {
    const q = jadwalSearch.toLowerCase();
    return (
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.instructor.toLowerCase().includes(q)
    );
  });

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Beginner Friendly");
    setInstructor("");
    setDateStr(todayStr);
    setStartTime("08:00");
    setEndTime("09:15");
    setPrice(90000);
    setMaxCapacity(10);
    setPhotoBase64(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEdit = (s: ScheduleItem) => {
    setEditingId(s.id);
    setTitle(s.title);
    setCategory(s.category);
    setInstructor(s.instructor);
    // convert ISO date → YYYY-MM-DD WIB
    const d = new Date(s.dateIso);
    const localDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    setDateStr(
      `${localDate.getUTCFullYear()}-${String(localDate.getUTCMonth() + 1).padStart(2, "0")}-${String(
        localDate.getUTCDate(),
      ).padStart(2, "0")}`,
    );
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setPrice(s.price);
    setMaxCapacity(s.maxCapacity);
    setPhotoBase64(s.instructorPhoto || null);
    setPhotoPreview(s.instructorPhoto || null);
    // scroll to form
    document
      .getElementById("class-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const b64 = await compressImage(file);
      setPhotoBase64(b64);
      setPhotoPreview(b64);
    } catch {
      showToast("Gagal memproses foto.", "error");
    } finally {
      setIsCompressing(false);
    }
  };

  // ── Create / Update ──────────────────────────────────────────────────────────
  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructor.trim()) {
      showToast("Judul kelas dan instruktur wajib diisi.", "error");
      return;
    }
    setIsAdding(true);

    const payload = {
      title,
      category,
      instructor,
      dateStr,
      startTime,
      endTime,
      price,
      maxCapacity,
      ...(photoBase64 ? { instructorPhoto: photoBase64 } : {}),
    };

    if (editingId) {
      // UPDATE
      const res = await updateClassSchedule(editingId, payload);
      setIsAdding(false);
      if (res.success) {
        // Parse date back
        const [y, m, d] = dateStr.split("-").map(Number);
        const wibMidnightUtc = new Date(
          Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 60 * 60 * 1000,
        );
        setSchedules((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  title,
                  category,
                  instructor,
                  dateIso: wibMidnightUtc.toISOString(),
                  startTime,
                  endTime,
                  price,
                  maxCapacity,
                  ...(photoBase64 ? { instructorPhoto: photoBase64 } : {}),
                }
              : s,
          ),
        );
        showToast("Jadwal kelas berhasil diperbarui.", "success");
        resetForm();
      } else {
        showToast(res.error || "Gagal memperbarui kelas", "error");
      }
    } else {
      // CREATE
      const res = await createClassSchedule(payload);
      setIsAdding(false);
      if (res.success && res.id) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const wibMidnightUtc = new Date(
          Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 60 * 60 * 1000,
        );
        setSchedules((prev) => [
          ...prev,
          {
            id: res.id!,
            title,
            category,
            instructor,
            dateIso: wibMidnightUtc.toISOString(),
            startTime,
            endTime,
            price,
            maxCapacity,
            bookedCount: 0,
            room: "Studio Utama Paranam",
            ...(photoBase64 ? { instructorPhoto: photoBase64 } : {}),
          },
        ]);
        showToast(
          "Jadwal kelas baru ditambahkan ke halaman publik.",
          "success",
        );
        resetForm();
      } else {
        showToast(res.error || "Gagal menambah kelas", "error");
      }
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const res = await deleteClassSchedule(id);
    if (res.success) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
      showToast("Jadwal kelas dihapus.", "success");
    } else {
      showToast(res.error || "Gagal menghapus jadwal", "error");
    }
  };

  const handleCloneNextWeek = async () => {
    setIsCloning(true);
    const res = await cloneNextWeekSchedules();
    setIsCloning(false);
    if (res.success && res.createdItems) {
      setSchedules((prev) => [...prev, ...res.createdItems!]);
      showToast(
        `${res.count} jadwal berhasil diterapkan ke minggu depan (+7 hari).`,
        "success",
      );
    } else {
      showToast(res.error || "Gagal menduplikat jadwal", "error");
    }
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Daftar Booking Kelas - Paranam Lumina Studio", 14, 15);
    doc.setFontSize(9);
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head: [
        [
          "No",
          "Kode",
          "Pemesan",
          "WA",
          "Kelas",
          "Instruktur",
          "Metode",
          "Bayar",
          "Hadir",
        ],
      ],
      body: filteredBookings.map((b, idx) => [
        idx + 1,
        b.bookingCode,
        b.customerName,
        b.customerPhone,
        `${b.className} (${b.startTime})`,
        b.instructor,
        METHOD_LABEL[b.paymentMethod] || b.paymentMethod,
        b.paymentStatus,
        b.attendanceStatus,
      ]),
      theme: "grid",
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [22, 38, 32] },
    });
    window.open(doc.output("bloburl"), "_blank");
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast((s) => ({ ...s, visible: false }))}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#162620] tracking-tight">
            Jadwal Kelas & Booking
          </h1>
          <p className="text-[#5D6E66] text-sm mt-1">
            Kelola pesanan tamu dari halaman publik & atur jadwal kelas studio.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker />
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-[#4D7762] hover:bg-[#3B6251] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Daftar Booking
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6E2D8] pb-3">
        <button
          onClick={() => setActiveTab("BOOKINGS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "BOOKINGS"
              ? "bg-[#4D7762] text-white shadow-sm"
              : "bg-white text-[#5D6E66] border border-[#E6E2D8] hover:border-[#4D7762]"
          }`}
        >
          <Users className="w-4 h-4" />
          Daftar Booking ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("JADWAL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "JADWAL"
              ? "bg-[#4D7762] text-white shadow-sm"
              : "bg-white text-[#5D6E66] border border-[#E6E2D8] hover:border-[#4D7762]"
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          Kelola Jadwal Kelas ({schedules.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: DAFTAR BOOKING
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "BOOKINGS" && (
        <div className="space-y-4">
          {/* Search + Filter Rows */}
          <div className="space-y-2.5">
            {/* Row 1: Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8A0]" />
              <input
                type="text"
                placeholder="Cari nama, kode, kelas, WA..."
                value={bookingSearch}
                onChange={(e) => {
                  setBookingSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6E2D8] rounded-xl text-xs font-semibold text-[#162620] outline-none focus:ring-2 focus:ring-[#4D7762]"
              />
            </div>

            {/* Row 2: Status filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5D6E66] shrink-0">
                Status:
              </span>
              {[
                { id: "ALL", label: "Semua" },
                { id: "PENDING", label: "Menunggu Bayar" },
                { id: "PAID", label: "Sudah Lunas" },
                { id: "ATTENDED", label: "Sudah Hadir" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterStatus(f.id as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    filterStatus === f.id
                      ? "bg-[#4D7762] text-white"
                      : "bg-white text-[#5D6E66] border border-[#E6E2D8] hover:border-[#4D7762]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Row 3: Instruktur filter pills */}
            {bookingInstructors.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5D6E66] shrink-0">
                  Instruktur:
                </span>
                {["ALL", ...bookingInstructors].map((instr) => (
                  <button
                    key={instr}
                    onClick={() => {
                      setFilterInstructor(instr);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      filterInstructor === instr
                        ? "bg-[#162620] text-white"
                        : "bg-[#F6F4EF] text-[#5D6E66] border border-[#E6E2D8] hover:bg-[#E6E2D8]"
                    }`}
                  >
                    {instr === "ALL" ? "Semua Instruktur" : instr}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6E2D8] bg-[#F6F4EF] text-[11px] font-bold uppercase tracking-wider text-[#5D6E66]">
                  <th className="py-3.5 px-4">Kode</th>
                  <th className="py-3.5 px-4">Pemesan & WA</th>
                  <th className="py-3.5 px-4">Kelas & Jadwal</th>
                  <th className="py-3.5 px-4">Pembayaran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE5] text-xs">
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-[#5D6E66]"
                    >
                      {bookingSearch
                        ? `Tidak ada booking untuk "${bookingSearch}".`
                        : "Belum ada data booking untuk filter ini."}
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((b) => {
                    const isCancelled = b.attendanceStatus === "CANCELLED";
                    const isPaid = b.paymentStatus === "PAID";
                    const isAttended = b.attendanceStatus === "ATTENDED";
                    return (
                      <tr
                        key={b.id}
                        className={
                          isCancelled ? "opacity-50" : "hover:bg-[#FAF9F6]"
                        }
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#162620]">
                          {b.bookingCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#162620]">
                            {b.customerName}
                          </div>
                          <div className="text-[11px] text-[#5D6E66]">
                            {b.customerPhone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#162620]">
                            {b.className}
                          </div>
                          <div className="text-[11px] text-[#5D6E66]">
                            {b.instructor} • {formatWibDate(b.scheduleDateIso)}{" "}
                            ({formatWibTime(b.startTime)})
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#162620]">
                            Rp {b.amount.toLocaleString("id-ID")}
                          </div>
                          <div className="text-[11px] text-[#5D6E66]">
                            {METHOD_LABEL[b.paymentMethod] || b.paymentMethod}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCancelled
                                  ? "bg-rose-50 text-rose-600"
                                  : isPaid
                                    ? "bg-[#E9EFEA] text-[#254336]"
                                    : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {isCancelled
                                ? "BATAL"
                                : isPaid
                                  ? "LUNAS"
                                  : "PENDING"}
                            </span>
                          </div>
                          {!isCancelled && (
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isAttended
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isAttended ? "HADIR" : "BELUM SCAN"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!isCancelled && (
                            <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                              {!isPaid && (
                                <button
                                  onClick={() => handleConfirmPay(b.id)}
                                  disabled={processingId === b.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {processingId === b.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  Acc Bayar
                                </button>
                              )}
                              {!isAttended && (
                                <button
                                  onClick={() => handleMarkAttended(b.id)}
                                  disabled={processingId === b.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#162620] hover:bg-[#254336] text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Hadir
                                </button>
                              )}
                              {!isAttended && (
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  disabled={processingId === b.id}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                                  title="Batalkan Booking"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredBookings.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: KELOLA JADWAL KELAS
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "JADWAL" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah / Edit */}
          <form
            id="class-form"
            onSubmit={handleSubmitSchedule}
            className="bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-sm space-y-4 h-fit"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#162620] flex items-center gap-2">
                {editingId ? (
                  <Pencil className="w-4 h-4 text-[#4D7762]" />
                ) : (
                  <Plus className="w-4 h-4 text-[#4D7762]" />
                )}
                {editingId ? "Edit Jadwal Kelas" : "Tambah Jadwal Kelas"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-[#5D6E66] hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Batal Edit
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {/* Foto Kelas */}
              <div>
                <label className="font-bold text-[#4C5C54] block mb-1">
                  Foto Kelas
                </label>
                <div
                  className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-[#DCD7CA] cursor-pointer hover:border-[#4D7762] transition-colors"
                  style={{ minHeight: 100 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="preview"
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 gap-2 text-[#9BA8A0]">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[11px] font-semibold">
                        Klik untuk upload foto
                      </span>
                      <span className="text-[10px]">
                        JPG / PNG · Maks 800px · Auto-kompres
                      </span>
                    </div>
                  )}
                  {isCompressing && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#4D7762]" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoBase64(null);
                      setPhotoPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-1 text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Hapus foto
                  </button>
                )}
              </div>

              <div>
                <label className="font-bold text-[#4C5C54] block mb-1">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth: Sunset Flow Yoga"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#4C5C54] block mb-1">
                    Instruktur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Oka"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
                  />
                  {bookingInstructors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {bookingInstructors.map((inst) => (
                        <button
                          key={inst}
                          type="button"
                          onClick={() => setInstructor(inst)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            instructor === inst
                              ? "bg-[#4D7762] text-white"
                              : "bg-[#E9EFEA] text-[#3B6251] hover:bg-[#C8E0D5]"
                          }`}
                        >
                          {inst}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-bold text-[#4C5C54] block mb-1">
                    Level / Kategori
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#4C5C54] block mb-1.5">
                  Pilih Hari Tetap{" "}
                  <span className="text-[#9BA8A0] font-normal">
                    (Otomatis Tanggal ke Depan)
                  </span>
                </label>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_OPTIONS.map((d) => {
                    const targetStr = getNextDateForJsDay(d.jsDay);
                    const active = dateStr === targetStr;
                    return (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => setDateStr(targetStr)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          active
                            ? "bg-[#4D7762] text-white"
                            : "bg-[#F6F4EF] text-[#4C5C54] hover:bg-[#E9EFEA]"
                        }`}
                      >
                        {d.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#4C5C54] block mb-1">
                    Jam Mulai{" "}
                    <span className="text-[#4D7762] font-bold">(WIB)</span>
                  </label>
                  <ModernTime24Picker
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
                <div>
                  <label className="font-bold text-[#4C5C54] block mb-1">
                    Jam Selesai{" "}
                    <span className="text-[#4D7762] font-bold">(WIB)</span>
                  </label>
                  <ModernTime24Picker value={endTime} onChange={setEndTime} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#4C5C54] block mb-1">
                    Tarif Sesi (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#4C5C54] block mb-1">
                    Kuota Matras
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdding || isCompressing}
              className="w-full py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editingId ? "Update Jadwal Kelas" : "Publish ke Jadwal Publik"}
            </button>
          </form>

          {/* Daftar Kelas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Jadwal + Clone Mingguan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8A0]" />
                <input
                  type="text"
                  placeholder="Cari kelas atau instruktur..."
                  value={jadwalSearch}
                  onChange={(e) => setJadwalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6E2D8] rounded-xl text-xs font-semibold text-[#162620] outline-none focus:ring-2 focus:ring-[#4D7762]"
                />
              </div>

              <button
                type="button"
                onClick={handleCloneNextWeek}
                disabled={isCloning}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E9EFEA] hover:bg-[#C8E0D5] text-[#2A5040] border border-[#A8C8B8] rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCloning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CopyPlus className="w-3.5 h-3.5" />
                )}
                Terapkan Jadwal ke Minggu Depan (+7 Hari)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
              {filteredSchedules.length === 0 ? (
                <div className="sm:col-span-2 py-10 text-center text-[#5D6E66] text-sm bg-white rounded-2xl border border-[#E6E2D8]">
                  {jadwalSearch
                    ? `Tidak ada kelas untuk "${jadwalSearch}".`
                    : "Belum ada jadwal kelas."}
                </div>
              ) : (
                filteredSchedules.map((s) => (
                  <div
                    key={s.id}
                    className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between gap-0 overflow-hidden transition-all ${
                      editingId === s.id
                        ? "border-[#4D7762] ring-2 ring-[#4D7762]/30"
                        : "border-[#E6E2D8]"
                    }`}
                  >
                    {/* Class photo */}
                    {s.instructorPhoto ? (
                      <div className="relative">
                        <img
                          src={s.instructorPhoto}
                          alt={s.title}
                          className="w-full h-28 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {formatWibTime(s.startTime)} –{" "}
                          {formatWibTime(s.endTime)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-16 bg-[#F6F4EF] flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-[#DCD7CA]" />
                      </div>
                    )}

                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7762] bg-[#E9EFEA] px-2.5 py-0.5 rounded-full">
                          {formatWibDate(s.dateIso)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(s)}
                            className="text-[#5D6E66] hover:text-[#4D7762] p-1 cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(s.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-[#162620]">
                          {s.title}
                        </h3>
                        <p className="text-xs text-[#5D6E66] mt-0.5">
                          Instruktur:{" "}
                          <strong className="text-[#162620]">
                            {s.instructor}
                          </strong>
                          {!s.instructorPhoto && (
                            <span className="ml-1.5 text-[10px] text-[#9BA8A0]">
                              {formatWibTime(s.startTime)}–
                              {formatWibTime(s.endTime)}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#F0EDE5] flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#162620]">
                          Rp {s.price.toLocaleString("id-ID")}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#F6F4EF] font-bold text-[#162620]">
                          Matras: {s.bookedCount}/{s.maxCapacity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
