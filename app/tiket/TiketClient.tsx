"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  getGuestTicketsByPhone,
  confirmGuestPayment,
  cancelGuestBooking,
  GuestTicketItem,
} from "@/app/actions/public";
import { useResponsivePagination } from "@/hooks/useResponsivePagination";
import { Pagination } from "@/components/ui/Pagination";
import {
  Phone,
  Search,
  Ticket,
  CalendarDays,
  User,
  ScanLine,
  ArrowLeft,
  Loader2,
  Trash2,
  Timer,
  CheckCircle2,
  History,
  XCircle,
  Download,
} from "lucide-react";

interface InitialResult {
  success: boolean;
  memberName?: string;
  tickets: GuestTicketItem[];
  error?: string;
}

function CountdownBadge({ expiresAtIso }: { expiresAtIso: string }) {
  const [sec, setSec] = useState(() =>
    Math.max(
      0,
      Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000),
    ),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSec(
        Math.max(
          0,
          Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000),
        ),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAtIso]);

  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDF3EC] text-[#B87A56] border border-[#F2D8C7] text-[10px] font-extrabold">
      <Timer className="w-3 h-3" />
      Sisa {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function TiketClient({
  initialPhone,
  initialResult,
}: {
  initialPhone: string;
  initialResult: InitialResult | null;
}) {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [phone, setPhone] = useState(initialPhone);
  const [searchedPhone, setSearchedPhone] = useState(initialPhone);
  const [tickets, setTickets] = useState<GuestTicketItem[]>(
    initialResult?.tickets || [],
  );
  const [memberName, setMemberName] = useState(initialResult?.memberName || "");
  const [hasSearched, setHasSearched] = useState(Boolean(initialResult));
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    initialResult?.error || null,
  );
  const [origin, setOrigin] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadTicketPNG = async (t: GuestTicketItem) => {
    setDownloadingId(t.id);
    try {
      // --- render QR SVG to image ---
      const qrEl = document.getElementById(`qr-${t.id}`) as SVGElement | null;
      let qrDataUrl = "";
      if (qrEl) {
        const svgData = new XMLSerializer().serializeToString(qrEl);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const svgUrl = URL.createObjectURL(svgBlob);
        const qrImg = new Image();
        await new Promise<void>((res) => {
          qrImg.onload = () => res();
          qrImg.src = svgUrl;
        });
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = 200;
        tmpCanvas.height = 200;
        const tCtx = tmpCanvas.getContext("2d")!;
        tCtx.fillStyle = "#ffffff";
        tCtx.fillRect(0, 0, 200, 200);
        tCtx.drawImage(qrImg, 10, 10, 180, 180);
        qrDataUrl = tmpCanvas.toDataURL("image/png");
        URL.revokeObjectURL(svgUrl);
      }

      // --- build main card canvas ---
      const W = 640;
      const H = qrDataUrl ? 580 : 420;
      const canvas = document.createElement("canvas");
      const dpr = 2;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = "#F6F4EF";
      ctx.fillRect(0, 0, W, H);

      // Card
      const PAD = 24;
      const cardW = W - PAD * 2;
      const cardH = H - PAD * 2;
      ctx.fillStyle = "#ffffff";
      const r = 24;
      ctx.beginPath();
      ctx.moveTo(PAD + r, PAD);
      ctx.lineTo(PAD + cardW - r, PAD);
      ctx.quadraticCurveTo(PAD + cardW, PAD, PAD + cardW, PAD + r);
      ctx.lineTo(PAD + cardW, PAD + cardH - r);
      ctx.quadraticCurveTo(
        PAD + cardW,
        PAD + cardH,
        PAD + cardW - r,
        PAD + cardH,
      );
      ctx.lineTo(PAD + r, PAD + cardH);
      ctx.quadraticCurveTo(PAD, PAD + cardH, PAD, PAD + cardH - r);
      ctx.lineTo(PAD, PAD + r);
      ctx.quadraticCurveTo(PAD, PAD, PAD + r, PAD);
      ctx.closePath();
      ctx.fill();

      // Header strip
      ctx.fillStyle = "#4D7762";
      ctx.beginPath();
      ctx.moveTo(PAD + r, PAD);
      ctx.lineTo(PAD + cardW - r, PAD);
      ctx.quadraticCurveTo(PAD + cardW, PAD, PAD + cardW, PAD + r);
      ctx.lineTo(PAD + cardW, PAD + 90);
      ctx.lineTo(PAD, PAD + 90);
      ctx.lineTo(PAD, PAD + r);
      ctx.quadraticCurveTo(PAD, PAD, PAD + r, PAD);
      ctx.closePath();
      ctx.fill();

      // Studio name
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "bold 11px Arial";
      ctx.fillText("PARANAM LUMINA STUDIO • E-TICKET", PAD + 20, PAD + 28);

      // Class name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial";
      const maxW = cardW - 160;
      let className = t.className;
      while (ctx.measureText(className).width > maxW && className.length > 10) {
        className = className.slice(0, -1);
      }
      if (className !== t.className) className += "…";
      ctx.fillText(className, PAD + 20, PAD + 58);

      // Date & time
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px Arial";
      ctx.fillText(
        `${t.dayOfWeek}, ${t.shortDate} • ${t.startTime} WIB`,
        PAD + 20,
        PAD + 80,
      );

      // Booking code badge
      ctx.fillStyle = "#ffffff";
      const codeX = PAD + cardW - 20 - 110;
      const codeY = PAD + 32;
      ctx.beginPath();
      ctx.roundRect(codeX, codeY, 110, 32, 16);
      ctx.fill();
      ctx.fillStyle = "#2A5040";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(t.bookingCode, codeX + 55, codeY + 21);
      ctx.textAlign = "left";

      // Body text
      let bodyY = PAD + 110;
      ctx.fillStyle = "#4D7762";
      ctx.font = "bold 11px Arial";
      ctx.fillText("INSTRUKTUR", PAD + 20, bodyY);
      ctx.fillStyle = "#162620";
      ctx.font = "bold 15px Arial";
      ctx.fillText(t.instructorName, PAD + 20, bodyY + 20);

      bodyY += 50;
      ctx.fillStyle = "#4D7762";
      ctx.font = "bold 11px Arial";
      ctx.fillText("PESERTA", PAD + 20, bodyY);
      ctx.fillStyle = "#162620";
      ctx.font = "bold 15px Arial";
      ctx.fillText(t.memberName, PAD + 20, bodyY + 20);

      bodyY += 50;
      ctx.fillStyle = "#4D7762";
      ctx.font = "bold 11px Arial";
      ctx.fillText("TOTAL BAYAR", PAD + 20, bodyY);
      ctx.fillStyle = "#162620";
      ctx.font = "bold 15px Arial";
      ctx.fillText(
        `Rp ${t.amount.toLocaleString("id-ID")}`,
        PAD + 20,
        bodyY + 20,
      );

      // Dashed divider
      bodyY += 50;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#E6E2D8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PAD + 20, bodyY);
      ctx.lineTo(PAD + cardW - 20, bodyY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Status badge
      bodyY += 20;
      ctx.fillStyle = "#E9EFEA";
      ctx.beginPath();
      ctx.roundRect(PAD + 20, bodyY - 14, 180, 26, 13);
      ctx.fill();
      ctx.fillStyle = "#254336";
      ctx.font = "bold 11px Arial";
      ctx.fillText("✓  LUNAS • E-Ticket Aktif", PAD + 36, bodyY + 5);

      // QR image
      if (qrDataUrl) {
        const qrImg2 = new Image();
        await new Promise<void>((res) => {
          qrImg2.onload = () => res();
          qrImg2.src = qrDataUrl;
        });
        const qrSize = 160;
        const qrX = PAD + cardW - 20 - qrSize;
        const qrTop = PAD + 108;
        // white box
        ctx.fillStyle = "#F6F4EF";
        ctx.beginPath();
        ctx.roundRect(qrX - 10, qrTop - 10, qrSize + 20, qrSize + 30, 14);
        ctx.fill();
        ctx.drawImage(qrImg2, qrX, qrTop, qrSize, qrSize);
        ctx.fillStyle = "#5D6E66";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Scan di studio", qrX + qrSize / 2, qrTop + qrSize + 16);
        ctx.textAlign = "left";
      }

      // Footer
      const footerY = PAD + cardH - 24;
      ctx.fillStyle = "#7A8881";
      ctx.font = "10px Arial";
      ctx.fillText(
        "Diterbitkan oleh PranajayaTech · pranajayatech.online",
        PAD + 20,
        footerY,
      );

      // Download
      const link = document.createElement("a");
      link.download = `E-Ticket-${t.bookingCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchTickets = async (targetPhone: string) => {
    if (!targetPhone.trim()) return;
    setIsLoading(true);
    setError(null);
    const res = await getGuestTicketsByPhone(targetPhone);
    setIsLoading(false);
    setHasSearched(true);
    setSearchedPhone(targetPhone);
    if (res.success) {
      setTickets(res.tickets);
      setMemberName(res.memberName || "");
      try {
        localStorage.setItem("paranam_guest_wa", targetPhone);
      } catch {}
    } else {
      setTickets([]);
      setError(res.error || "Gagal mencari tiket.");
    }
  };

  useEffect(() => {
    setOrigin(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
    if (!initialPhone) {
      try {
        const savedWa = localStorage.getItem("paranam_guest_wa");
        if (savedWa) {
          setPhone(savedWa);
          fetchTickets(savedWa);
        }
      } catch {}
    } else {
      try {
        localStorage.setItem("paranam_guest_wa", initialPhone);
      } catch {}
    }
  }, [initialPhone]);

  // Pisahkan Tiket Aktif vs Riwayat Transaksi
  const { activeTickets, historyTickets } = useMemo(() => {
    const active: GuestTicketItem[] = [];
    const history: GuestTicketItem[] = [];
    for (const t of tickets) {
      const isCancelled =
        t.attendanceStatus === "CANCELLED" || t.paymentStatus === "REJECTED";
      const isAttended = t.attendanceStatus === "ATTENDED";
      if (isCancelled || isAttended) {
        history.push(t);
      } else {
        active.push(t);
      }
    }
    return { activeTickets: active, historyTickets: history };
  }, [tickets]);

  const displayedTickets =
    activeTab === "ACTIVE" ? activeTickets : historyTickets;

  const {
    itemsPerPage,
    currentPage,
    setCurrentPage,
    paginatedData: paginatedTickets,
    totalPages,
  } = useResponsivePagination(displayedTickets);

  const handleTabChange = (tab: "ACTIVE" | "HISTORY") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchTickets(phone);
  };

  const handleConfirmPay = async (bookingId: string) => {
    setProcessingId(bookingId);
    setError(null);
    const res = await confirmGuestPayment(bookingId, searchedPhone || phone);
    setProcessingId(null);
    if (res.success) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === bookingId ? { ...t, paymentStatus: "PAID" } : t,
        ),
      );
    } else {
      setError(res.error || "Gagal mengkonfirmasi pembayaran.");
    }
  };

  const handleCancel = async (bookingId: string) => {
    setProcessingId(bookingId);
    setError(null);
    const res = await cancelGuestBooking(bookingId, searchedPhone || phone);
    setProcessingId(null);
    if (res.success) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === bookingId
            ? { ...t, attendanceStatus: "CANCELLED", paymentStatus: "REJECTED" }
            : t,
        ),
      );
    } else {
      setError(res.error || "Gagal membatalkan tiket.");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#F6F4EF] text-[#162620] flex flex-col font-sans overflow-x-hidden">
      {/* ===== FULL-WIDTH HEADER SAGE SOLID + TEKS BOLD PUTIH TERANG ===== */}
      <header className="w-full bg-[#4D7762] border-b border-[#3B6251] pt-[max(1.5rem,env(safe-area-inset-top))] pb-7 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-[#2A5040] hover:bg-[#E9EFEA] transition-colors text-xs font-extrabold shadow-sm touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 text-[#4D7762]" />
              Kembali ke Jadwal
            </Link>
            <span className="text-white text-[11px] font-black tracking-[0.15em] uppercase">
              PARANAM LUMINA STUDIO
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            E-Ticket Saya
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-white/95 mt-1">
            Masukkan nomor WhatsApp untuk cek tiket aktif, QR masuk kelas, &
            riwayat transaksi.
          </p>
        </div>
      </header>

      {/* ===== FULL-WIDTH SEARCH BAR ===== */}
      <div className="w-full bg-white border-b border-[#E6E2D8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-2.5 max-w-xl">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-[#7A8881] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="No. WhatsApp (cth: 08xxxxxxxxxx)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl text-base sm:text-sm font-semibold text-[#162620] focus:outline-none focus:ring-2 focus:ring-[#4D7762] focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shrink-0 transition-all active:scale-[0.97] cursor-pointer touch-manipulation"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Cari
            </button>
          </form>
        </div>
      </div>

      {/* ===== TICKETS LIST (2 TABS: TIKET AKTIF vs RIWAYAT TRANSAKSI) ===== */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-[max(3rem,env(safe-area-inset-bottom))] space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}

        {!hasSearched ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#E6E2D8] max-w-lg mx-auto">
            <Ticket className="w-11 h-11 text-[#4D7762]/50 mx-auto mb-3" />
            <h2 className="text-base font-extrabold text-[#162620]">
              Cek E-Ticket & Status Pembayaran
            </h2>
            <p className="text-xs sm:text-sm text-[#5D6E66] mt-1 max-w-xs mx-auto">
              Masukkan nomor WhatsApp yang kamu pakai saat checkout kelas.
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#E6E2D8] max-w-lg mx-auto">
            <CalendarDays className="w-11 h-11 text-[#7A8881]/50 mx-auto mb-3" />
            <h2 className="text-base font-extrabold text-[#162620]">
              Belum Ada Transaksi
            </h2>
            <p className="text-xs sm:text-sm text-[#5D6E66] mt-1 mb-5">
              Tidak ditemukan riwayat booking untuk nomor {searchedPhone}.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#4D7762] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#3B6251] transition-colors touch-manipulation"
            >
              Lihat Jadwal & Booking
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Info + 2 Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {memberName ? (
                <div className="text-xs sm:text-sm font-bold text-[#5D6E66]">
                  Pesanan untuk{" "}
                  <span className="text-[#162620]">{memberName}</span> (
                  {searchedPhone})
                </div>
              ) : (
                <div />
              )}

              <div className="inline-flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E6E2D8] shadow-xs w-fit">
                <button
                  type="button"
                  onClick={() => handleTabChange("ACTIVE")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation ${
                    activeTab === "ACTIVE"
                      ? "bg-[#4D7762] text-white shadow-xs"
                      : "text-[#5D6E66] hover:text-[#162620]"
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Tiket Aktif ({activeTickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("HISTORY")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation ${
                    activeTab === "HISTORY"
                      ? "bg-[#4D7762] text-white shadow-xs"
                      : "text-[#5D6E66] hover:text-[#162620]"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Riwayat Transaksi ({historyTickets.length})
                </button>
              </div>
            </div>

            {displayedTickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2D8]">
                <p className="text-sm font-bold text-[#162620]">
                  {activeTab === "ACTIVE"
                    ? "Tidak ada tiket aktif saat ini."
                    : "Belum ada riwayat transaksi selesai."}
                </p>
                <p className="text-xs text-[#5D6E66] mt-1">
                  {activeTab === "ACTIVE"
                    ? "Cek tab Riwayat Transaksi untuk melihat kelas sebelumnya atau booking kelas baru."
                    : "Kelas yang sudah hadir atau dibatalkan akan muncul di sini."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedTickets.map((t) => {
                    const isPaid = t.paymentStatus === "PAID";
                    const isCancelled =
                      t.attendanceStatus === "CANCELLED" ||
                      t.paymentStatus === "REJECTED";
                    const isAttended = t.attendanceStatus === "ATTENDED";

                    return (
                      <div
                        key={t.id}
                        className={`bg-white rounded-3xl border border-[#E6E2D8] shadow-sm overflow-hidden flex flex-col justify-between ${
                          isCancelled ? "opacity-75" : ""
                        }`}
                      >
                        <div>
                          {/* Header */}
                          <div
                            className={`px-5 py-4 text-white flex items-center justify-between gap-2 ${
                              isCancelled ? "bg-slate-600" : "bg-[#4D7762]"
                            }`}
                          >
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/85">
                                {t.dayOfWeek}, {t.shortDate} • {t.startTime} WIB
                              </span>
                              <h3 className="text-base font-extrabold mt-0.5">
                                {t.className}
                              </h3>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-white text-[#2A5040] text-[10px] font-black shrink-0 shadow-xs">
                              {t.bookingCode}
                            </span>
                          </div>

                          {/* Info Bar */}
                          <div className="border-b border-dashed border-[#E6E2D8] px-5 py-3 flex items-center justify-between text-xs bg-[#F6F4EF]/70">
                            <span className="font-semibold text-[#162620] flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#4D7762]" />
                              {t.instructorName}
                            </span>
                            {isCancelled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Dibatalkan
                              </span>
                            ) : isPaid ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E9EFEA] text-[#254336]">
                                {isAttended
                                  ? "SUDAH HADIR"
                                  : "LUNAS • E-Ticket Aktif"}
                              </span>
                            ) : t.isGuestHold ? (
                              <CountdownBadge expiresAtIso={t.expiresAtIso} />
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF3EC] text-[#B87A56] border border-[#F2D8C7]">
                                Menunggu Bayar ({t.paymentMethod})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Body */}
                        {isCancelled ? (
                          <div className="p-5 flex-1 flex flex-col justify-between text-xs text-[#5D6E66] space-y-2">
                            <p>
                              Pesanan sebesar{" "}
                              <strong className="text-[#162620]">
                                Rp {t.amount.toLocaleString("id-ID")}
                              </strong>{" "}
                              ({t.paymentMethod}) telah dibatalkan atau melewati
                              batas waktu 15 menit.
                            </p>
                          </div>
                        ) : isPaid ? (
                          <div className="p-5 flex-1 flex flex-col items-center justify-between text-center">
                            <div className="flex flex-col items-center">
                              {!isAttended && (
                                <div className="w-40 h-40 bg-white p-3 rounded-2xl border border-[#E6E2D8] shadow-inner flex items-center justify-center mb-3">
                                  <QRCode
                                    id={`qr-${t.id}`}
                                    value={`${origin}/verify/${t.bookingCode}`}
                                    size={140}
                                    style={{
                                      height: "auto",
                                      maxWidth: "100%",
                                      width: "100%",
                                    }}
                                  />
                                </div>
                              )}

                              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#162620] bg-[#E9EFEA] px-3 py-1.5 rounded-full">
                                <ScanLine className="w-3.5 h-3.5 text-[#4D7762]" />
                                {isAttended
                                  ? "Check-in selesai · Terima kasih sudah berlatih!"
                                  : "Tunjukkan QR ini ke kasir/studio"}
                              </div>
                            </div>

                            {!isAttended && (
                              <button
                                onClick={() => downloadTicketPNG(t)}
                                disabled={downloadingId === t.id}
                                className="mt-3 w-full py-2.5 bg-[#F6F4EF] hover:bg-[#EAE7DE] border border-[#E6E2D8] text-[#2A5040] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 touch-manipulation transition-colors"
                              >
                                {downloadingId === t.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                {downloadingId === t.id
                                  ? "Menyiapkan..."
                                  : "Simpan E-Ticket (PNG)"}
                              </button>
                            )}

                            <div className="mt-4 pt-3 border-t border-[#F0EDE5] w-full flex items-center justify-between text-xs">
                              <span className="text-[#7A8881] font-medium">
                                {t.memberName} • Rp{" "}
                                {t.amount.toLocaleString("id-ID")}
                              </span>
                              {!isAttended && (
                                <button
                                  onClick={() => handleCancel(t.id)}
                                  disabled={processingId === t.id}
                                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer disabled:opacity-50 touch-manipulation"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Batalkan
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                            <p className="text-xs text-[#5D6E66]">
                              Tagihan{" "}
                              <strong className="text-[#162620]">
                                Rp {t.amount.toLocaleString("id-ID")}
                              </strong>{" "}
                              ({t.paymentMethod}). Konfirmasi pembayaran sebelum
                              tenggat waktu habis agar E-Ticket QR bisa terbit.
                            </p>
                            <div className="space-y-2">
                              <button
                                onClick={() => handleConfirmPay(t.id)}
                                disabled={processingId === t.id}
                                className="w-full py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 touch-manipulation"
                              >
                                {processingId === t.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                Konfirmasi Sudah Bayar
                              </button>
                              <button
                                onClick={() => handleCancel(t.id)}
                                disabled={processingId === t.id}
                                className="w-full py-2 text-rose-600 font-bold text-xs hover:bg-rose-50 rounded-xl transition-colors cursor-pointer touch-manipulation"
                              >
                                Batalkan Pesanan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={displayedTickets.length}
                  itemsPerPage={itemsPerPage}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
