"use client";

import {
  CheckCircle2,
  Loader2,
  UserCheck,
  XCircle,
  Search,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { BookingItem, METHOD_LABEL } from "./types";

interface BookingsTabProps {
  bookingSearch: string;
  setBookingSearch: (v: string) => void;
  filterStatus: "ALL" | "PENDING" | "PAID" | "ATTENDED";
  setFilterStatus: (v: "ALL" | "PENDING" | "PAID" | "ATTENDED") => void;
  filterInstructor: string;
  setFilterInstructor: (v: string) => void;
  bookingInstructors: string[];
  paginatedBookings: BookingItem[];
  filteredBookingsLength: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setCurrentPage: (p: number) => void;
  processingId: string | null;
  formatWibDate: (iso: string) => string;
  formatWibTime: (t: string) => string;
  handleConfirmPay: (id: string) => void;
  handleMarkAttended: (id: string) => void;
  handleCancelBooking: (id: string) => void;
}

export function BookingsTab({
  bookingSearch,
  setBookingSearch,
  filterStatus,
  setFilterStatus,
  filterInstructor,
  setFilterInstructor,
  bookingInstructors,
  paginatedBookings,
  filteredBookingsLength,
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  processingId,
  formatWibDate,
  formatWibTime,
  handleConfirmPay,
  handleMarkAttended,
  handleCancelBooking,
}: BookingsTabProps) {
  return (
    <div className="space-y-4">
      {/* Search + Filter Rows */}
      <div className="space-y-2.5">
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
                setFilterStatus(
                  f.id as "ALL" | "PENDING" | "PAID" | "ATTENDED",
                );
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

      {/* Mobile card list + Desktop table */}
      <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
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
                  <td colSpan={6} className="py-10 text-center text-[#5D6E66]">
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
                          {b.instructor} • {formatWibDate(b.scheduleDateIso)} (
                          {formatWibTime(b.startTime)})
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

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-[#F0EDE5]">
          {paginatedBookings.length === 0 ? (
            <div className="py-10 text-center text-[#5D6E66] text-sm">
              {bookingSearch
                ? `Tidak ada booking untuk "${bookingSearch}".`
                : "Belum ada data booking untuk filter ini."}
            </div>
          ) : (
            paginatedBookings.map((b) => {
              const isCancelled = b.attendanceStatus === "CANCELLED";
              const isPaid = b.paymentStatus === "PAID";
              const isAttended = b.attendanceStatus === "ATTENDED";
              return (
                <div
                  key={b.id}
                  className={`p-4 space-y-3 ${isCancelled ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-black text-xs text-[#162620] bg-[#F6F4EF] px-2 py-1 rounded-lg">
                      {b.bookingCode}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCancelled
                            ? "bg-rose-50 text-rose-600"
                            : isPaid
                              ? "bg-[#E9EFEA] text-[#254336]"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isCancelled ? "BATAL" : isPaid ? "LUNAS" : "PENDING"}
                      </span>
                      {!isCancelled && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAttended
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isAttended ? "HADIR" : "BELUM SCAN"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#162620]">
                      {b.customerName}
                    </p>
                    <p className="text-xs text-[#5D6E66]">{b.customerPhone}</p>
                  </div>
                  <div className="bg-[#F6F4EF] rounded-xl px-3 py-2.5 space-y-1">
                    <p className="font-bold text-xs text-[#162620]">
                      {b.className}
                    </p>
                    <p className="text-[11px] text-[#5D6E66]">
                      {b.instructor} • {formatWibDate(b.scheduleDateIso)} (
                      {formatWibTime(b.startTime)})
                    </p>
                    <p className="font-bold text-xs text-[#162620] pt-1">
                      Rp {b.amount.toLocaleString("id-ID")}{" "}
                      <span className="font-normal text-[#5D6E66]">
                        · {METHOD_LABEL[b.paymentMethod] || b.paymentMethod}
                      </span>
                    </p>
                  </div>
                  {!isCancelled && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isPaid && (
                        <button
                          onClick={() => handleConfirmPay(b.id)}
                          disabled={processingId === b.id}
                          className="flex-1 py-2 rounded-xl bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                        >
                          {processingId === b.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Acc Bayar
                        </button>
                      )}
                      {!isAttended && (
                        <button
                          onClick={() => handleMarkAttended(b.id)}
                          disabled={processingId === b.id}
                          className="flex-1 py-2 rounded-xl bg-[#162620] hover:bg-[#254336] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Hadir
                        </button>
                      )}
                      {!isAttended && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={processingId === b.id}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer disabled:opacity-50 touch-manipulation"
                          title="Batalkan"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredBookingsLength}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
