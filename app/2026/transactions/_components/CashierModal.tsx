"use client";

import type React from "react";
import { Banknote, X, ChevronDown, CalendarDays, Loader2 } from "lucide-react";
import { ScheduleOption, PackageOption } from "./types";

interface CashierModalProps {
  cashierOpen: boolean;
  setCashierOpen: (v: boolean) => void;
  cashierName: string;
  setCashierName: (v: string) => void;
  cashierPhone: string;
  setCashierPhone: (v: string) => void;
  cashierScheduleId: string;
  setCashierScheduleId: (v: string) => void;
  cashierPackageId: string;
  setCashierPackageId: (v: string) => void;
  cashierMethod: "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL";
  setCashierMethod: (
    v: "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL",
  ) => void;
  cashReceived: string;
  setCashReceived: (v: string) => void;
  isSavingCashier: boolean;
  schedulePickerOpen: boolean;
  setSchedulePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  packagePickerOpen: boolean;
  setPackagePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeSchedules: ScheduleOption[];
  activePackages: PackageOption[];
  selectedSchedule: ScheduleOption | undefined;
  selectedPackage: PackageOption | undefined;
  cashierAmount: number;
  cashChange: number;
  handleSaveCashier: (e: React.FormEvent) => void;
}

export function CashierModal({
  cashierOpen,
  setCashierOpen,
  cashierName,
  setCashierName,
  cashierPhone,
  setCashierPhone,
  cashierScheduleId,
  setCashierScheduleId,
  cashierPackageId,
  setCashierPackageId,
  cashierMethod,
  setCashierMethod,
  cashReceived,
  setCashReceived,
  isSavingCashier,
  schedulePickerOpen,
  setSchedulePickerOpen,
  packagePickerOpen,
  setPackagePickerOpen,
  activeSchedules,
  activePackages,
  selectedSchedule,
  selectedPackage,
  cashierAmount,
  cashChange,
  handleSaveCashier,
}: CashierModalProps) {
  if (!cashierOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#162620]/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E6E2D8] shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        <div className="px-6 py-4 bg-[#C8E0D5] border-b border-[#A8C8B8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4D7762] text-white flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1D3D30]">
                Input Pembayaran Kasir
              </h3>
              <p className="text-[11px] text-[#3B6251]">
                Untuk tamu bayar Tunai / Walk-in / Pilih Paket
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCashierOpen(false)}
            className="p-1.5 rounded-lg text-[#2A5040] hover:bg-white/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSaveCashier}
          className="p-6 space-y-4 overflow-y-auto text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1">
                Nama Tamu *
              </label>
              <input
                type="text"
                required
                placeholder="cth: Rina Kusuma"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
              />
            </div>
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1">
                No. WhatsApp{" "}
                <span className="font-normal text-[#7A8881]">(Opsional)</span>
              </label>
              <input
                type="tel"
                placeholder="Kosongkan jika tamu tanpa HP"
                value={cashierPhone}
                onChange={(e) => setCashierPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
              />
            </div>
          </div>

          {/* Modern Selector: Jadwal Kelas */}
          <div className="relative">
            <label className="font-bold text-[#4C5C54] block mb-1">
              Pilih Jadwal Kelas *
            </label>
            <button
              type="button"
              onClick={() => {
                setSchedulePickerOpen((v) => !v);
                setPackagePickerOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#F6F4EF] hover:bg-[#E9EFEA]/60 border border-[#DCD7CA] rounded-xl text-left transition-colors cursor-pointer"
            >
              {selectedSchedule ? (
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[#162620] truncate">
                    {selectedSchedule.title}
                  </p>
                  <p className="text-[11px] text-[#5D6E66] mt-0.5">
                    {selectedSchedule.dateLabel} • {selectedSchedule.startTime}{" "}
                    WIB •{" "}
                    <span className="font-bold text-[#4D7762]">
                      Sisa {selectedSchedule.remaining} matras
                    </span>
                  </p>
                </div>
              ) : (
                <span className="font-semibold text-[#7A8881]">
                  Belum ada jadwal aktif
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-[#5D6E66] shrink-0 transition-transform ${
                  schedulePickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {schedulePickerOpen && (
              <div className="mt-1.5 max-h-52 overflow-y-auto bg-white border border-[#DCD7CA] rounded-2xl shadow-xl p-1.5 space-y-1">
                {activeSchedules.length === 0 ? (
                  <p className="p-3 text-center text-[#5D6E66]">
                    Belum ada jadwal aktif
                  </p>
                ) : (
                  activeSchedules.map((s) => {
                    const isSelected = s.id === cashierScheduleId;
                    const isFull = s.remaining <= 0;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => {
                          setCashierScheduleId(s.id);
                          setSchedulePickerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-left transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          isSelected
                            ? "bg-[#4D7762] text-white"
                            : "hover:bg-[#F6F4EF] text-[#162620]"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{s.title}</p>
                          <p
                            className={`text-[10px] ${isSelected ? "text-white/85" : "text-[#5D6E66]"}`}
                          >
                            <CalendarDays className="w-3 h-3 inline mr-1" />
                            {s.dateLabel} • {s.startTime} WIB • {s.instructor}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-extrabold">
                            Rp {s.price.toLocaleString("id-ID")}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : isFull
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-[#E9EFEA] text-[#3B6251]"
                            }`}
                          >
                            {isFull ? "Penuh" : `Sisa ${s.remaining}`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 2 Opsi Jenis Pembayaran Kasir: Per Kelas vs Paket & Tarif */}
          <div>
            <label className="font-bold text-[#4C5C54] block mb-1.5">
              Jenis Pembayaran *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCashierPackageId("DROP_IN");
                  setPackagePickerOpen(false);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-left border transition-colors cursor-pointer ${
                  cashierPackageId === "DROP_IN"
                    ? "bg-[#4D7762] text-white border-[#4D7762]"
                    : "bg-[#F6F4EF] text-[#162620] border-[#DCD7CA] hover:border-[#4D7762]"
                }`}
              >
                <p className="text-xs font-extrabold">Per Jadwal Kelas</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    cashierPackageId === "DROP_IN"
                      ? "text-white/85"
                      : "text-[#5D6E66]"
                  }`}
                >
                  Tanpa paket · Tarif kelas
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cashierPackageId === "DROP_IN" && activePackages[0]) {
                    setCashierPackageId(activePackages[0].id);
                  }
                  setPackagePickerOpen(true);
                  setSchedulePickerOpen(false);
                }}
                disabled={activePackages.length === 0}
                className={`py-2.5 px-3 rounded-xl font-bold text-left border transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                  cashierPackageId !== "DROP_IN"
                    ? "bg-[#4D7762] text-white border-[#4D7762]"
                    : "bg-[#F6F4EF] text-[#162620] border-[#DCD7CA] hover:border-[#4D7762]"
                }`}
              >
                <p className="text-xs font-extrabold">Paket & Tarif</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    cashierPackageId !== "DROP_IN"
                      ? "text-white/85"
                      : "text-[#5D6E66]"
                  }`}
                >
                  {activePackages.length > 0
                    ? `${activePackages.length} paket tersedia`
                    : "Belum ada paket"}
                </p>
              </button>
            </div>
          </div>

          {/* Modern Selector: Pilihan Paket / Tarif (hanya tampil saat mode Paket dipilih) */}
          {cashierPackageId !== "DROP_IN" && (
            <div className="relative">
              <label className="font-bold text-[#4C5C54] block mb-1">
                Pilih Paket Sesi *
              </label>
              <button
                type="button"
                onClick={() => {
                  setPackagePickerOpen((v) => !v);
                  setSchedulePickerOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#F6F4EF] hover:bg-[#E9EFEA]/60 border border-[#DCD7CA] rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[#162620] truncate">
                    {selectedPackage
                      ? `Paket: ${selectedPackage.name}`
                      : "Single Visit / Drop-in"}
                  </p>
                  <p className="text-[11px] text-[#4D7762] font-bold mt-0.5">
                    {selectedPackage
                      ? `${selectedPackage.totalSessions} Sesi • `
                      : "1x Pertemuan • "}
                    Rp {cashierAmount.toLocaleString("id-ID")}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#5D6E66] shrink-0 transition-transform ${
                    packagePickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {packagePickerOpen && (
                <div className="mt-1.5 max-h-52 overflow-y-auto bg-white border border-[#DCD7CA] rounded-2xl shadow-xl p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCashierPackageId("DROP_IN");
                      setPackagePickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      cashierPackageId === "DROP_IN"
                        ? "bg-[#4D7762] text-white"
                        : "hover:bg-[#F6F4EF] text-[#162620]"
                    }`}
                  >
                    <div>
                      <p className="font-bold">Single Visit / Drop-in</p>
                      <p
                        className={`text-[10px] ${cashierPackageId === "DROP_IN" ? "text-white/85" : "text-[#5D6E66]"}`}
                      >
                        1x Pertemuan sesuai tarif kelas
                      </p>
                    </div>
                    <span className="font-extrabold shrink-0">
                      Rp{" "}
                      {(selectedSchedule?.price || 90000).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </button>

                  {activePackages.map((p) => {
                    const isSelected = cashierPackageId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setCashierPackageId(p.id);
                          setPackagePickerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#4D7762] text-white"
                            : "hover:bg-[#F6F4EF] text-[#162620]"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{p.name}</p>
                          <p
                            className={`text-[10px] ${isSelected ? "text-white/85" : "text-[#5D6E66]"}`}
                          >
                            {p.totalSessions} Sesi Studio
                          </p>
                        </div>
                        <span className="font-extrabold shrink-0">
                          Rp {p.price.toLocaleString("id-ID")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="font-bold text-[#4C5C54] block mb-1.5">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "CASH_STUDIO", label: "Tunai (Cash)" },
                { id: "TRANSFER_MANUAL", label: "Transfer BCA" },
                { id: "QRIS_MANUAL", label: "QRIS" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setCashierMethod(
                      m.id as "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL",
                    )
                  }
                  className={`py-2 px-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                    cashierMethod === m.id
                      ? "bg-[#4D7762] text-white border-[#4D7762]"
                      : "bg-[#F6F4EF] text-[#4C5C54] border-[#DCD7CA]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kalkulator Uang Tunai & Kembalian */}
          <div className="p-3.5 rounded-2xl bg-[#E9EFEA] border border-[#C8E0D5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2A5040]">Total Tagihan</span>
              <span className="text-base font-black text-[#1D3D30]">
                Rp {cashierAmount.toLocaleString("id-ID")}
              </span>
            </div>
            {cashierMethod === "CASH_STUDIO" && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#C8E0D5]">
                <div>
                  <label className="text-[11px] font-bold text-[#3B6251] block mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder={String(cashierAmount)}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#A8C8B8] rounded-xl font-bold text-[#162620]"
                  />
                </div>
                <div className="flex flex-col justify-center items-end">
                  <span className="text-[11px] font-bold text-[#3B6251]">
                    Kembalian
                  </span>
                  <span className="text-sm font-black text-[#4D7762]">
                    Rp {cashChange.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCashierOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-[#F6F4EF] hover:bg-[#E6E2D8] font-bold text-[#5D6E66] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingCashier || !cashierScheduleId}
              className="flex-1 py-2.5 rounded-xl bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingCashier && <Loader2 className="w-4 h-4 animate-spin" />}
              Catat Lunas & Terbitkan Tiket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
