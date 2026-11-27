"use client";

import { useState, useRef, useCallback } from "react";
import type React from "react";
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
import { CalendarClock, Printer, Users, Tag } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BookingItem,
  ScheduleItem,
  PackageItem,
  METHOD_LABEL,
  compressImage,
} from "./_components/types";
import { BookingsTab } from "./_components/BookingsTab";
import { SchedulesTab } from "./_components/SchedulesTab";
import { PackagesTab } from "./_components/PackagesTab";

export default function ClassesClient({
  initialBookings,
  initialSchedules,
  initialPackages = [],
}: {
  initialBookings: BookingItem[];
  initialSchedules: ScheduleItem[];
  initialPackages?: PackageItem[];
}) {
  const [activeTab, setActiveTab] = useState<"BOOKINGS" | "JADWAL" | "PAKET">(
    "BOOKINGS",
  );
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState(90000);
  const [pkgSessions, setPkgSessions] = useState(1);
  const [pkgValidity, setPkgValidity] = useState(30);
  const [isSavingPkg, setIsSavingPkg] = useState(false);
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
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6">
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
        <button
          onClick={() => setActiveTab("PAKET")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "PAKET"
              ? "bg-[#4D7762] text-white shadow-sm"
              : "bg-white text-[#5D6E66] border border-[#E6E2D8] hover:border-[#4D7762]"
          }`}
        >
          <Tag className="w-4 h-4" />
          Paket & Tarif ({packages.length})
        </button>
      </div>

      {/* TAB 1: DAFTAR BOOKING */}
      {activeTab === "BOOKINGS" && (
        <BookingsTab
          bookingSearch={bookingSearch}
          setBookingSearch={setBookingSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterInstructor={filterInstructor}
          setFilterInstructor={setFilterInstructor}
          bookingInstructors={bookingInstructors}
          paginatedBookings={paginatedBookings}
          filteredBookingsLength={filteredBookings.length}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
          processingId={processingId}
          formatWibDate={formatWibDate}
          formatWibTime={formatWibTime}
          handleConfirmPay={handleConfirmPay}
          handleMarkAttended={handleMarkAttended}
          handleCancelBooking={handleCancelBooking}
        />
      )}

      {/* TAB 2: KELOLA JADWAL KELAS */}
      {activeTab === "JADWAL" && (
        <SchedulesTab
          editingId={editingId}
          resetForm={resetForm}
          handleSubmitSchedule={handleSubmitSchedule}
          fileInputRef={fileInputRef}
          photoPreview={photoPreview}
          isCompressing={isCompressing}
          handlePhotoChange={handlePhotoChange}
          setPhotoBase64={setPhotoBase64}
          setPhotoPreview={setPhotoPreview}
          title={title}
          setTitle={setTitle}
          instructor={instructor}
          setInstructor={setInstructor}
          bookingInstructors={bookingInstructors}
          category={category}
          setCategory={setCategory}
          dateStr={dateStr}
          setDateStr={setDateStr}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          price={price}
          setPrice={setPrice}
          maxCapacity={maxCapacity}
          setMaxCapacity={setMaxCapacity}
          isAdding={isAdding}
          jadwalSearch={jadwalSearch}
          setJadwalSearch={setJadwalSearch}
          handleCloneNextWeek={handleCloneNextWeek}
          isCloning={isCloning}
          filteredSchedules={filteredSchedules}
          startEdit={startEdit}
          handleDeleteSchedule={handleDeleteSchedule}
          formatWibDate={formatWibDate}
          formatWibTime={formatWibTime}
        />
      )}

      {/* TAB 3: KELOLA PAKET & TARIF (SYNC KE KASIR) */}
      {activeTab === "PAKET" && (
        <PackagesTab
          packages={packages}
          setPackages={setPackages}
          editingPkgId={editingPkgId}
          setEditingPkgId={setEditingPkgId}
          pkgName={pkgName}
          setPkgName={setPkgName}
          pkgDesc={pkgDesc}
          setPkgDesc={setPkgDesc}
          pkgPrice={pkgPrice}
          setPkgPrice={setPkgPrice}
          pkgSessions={pkgSessions}
          setPkgSessions={setPkgSessions}
          pkgValidity={pkgValidity}
          setPkgValidity={setPkgValidity}
          isSavingPkg={isSavingPkg}
          setIsSavingPkg={setIsSavingPkg}
          showToast={showToast}
        />
      )}
    </div>
  );
}
