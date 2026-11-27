"use client";

import type React from "react";
import { Plus, Search, Trash2, Loader2, ChevronDown } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { ExpenseItem, methodLabels } from "./types";

interface ExpenseTabProps {
  expCategory: string;
  setExpCategory: (v: string) => void;
  categoryPickerOpen: boolean;
  setCategoryPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMethodPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expDesc: string;
  setExpDesc: (v: string) => void;
  expAmount: string;
  setExpAmount: (v: string) => void;
  expMethod: "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL";
  setExpMethod: (v: "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL") => void;
  expSearch: string;
  setExpSearch: (v: string) => void;
  isSavingExp: boolean;
  paginatedExpenses: ExpenseItem[];
  expPage: number;
  expTotalPages: number;
  setExpPage: (p: number) => void;
  handleCreateExpense: (e: React.FormEvent) => void;
  handleDeleteExpense: (id: string) => void;
}

export function ExpenseTab({
  expCategory,
  setExpCategory,
  categoryPickerOpen,
  setCategoryPickerOpen,
  setMethodPickerOpen,
  expDesc,
  setExpDesc,
  expAmount,
  setExpAmount,
  expMethod,
  setExpMethod,
  expSearch,
  setExpSearch,
  isSavingExp,
  paginatedExpenses,
  expPage,
  expTotalPages,
  setExpPage,
  handleCreateExpense,
  handleDeleteExpense,
}: ExpenseTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Input Pengeluaran */}
      <form
        onSubmit={handleCreateExpense}
        className="lg:col-span-5 bg-white rounded-2xl border border-[#E6E2D8] p-4 sm:p-6 shadow-sm space-y-4 h-fit"
      >
        <h2 className="text-base font-extrabold text-[#162620] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#4D7762]" />
          Catat Pengeluaran Kasir
        </h2>

        <div className="space-y-4 text-xs">
          {/* Modern Kategori Picker */}
          <div className="relative">
            <label className="font-bold text-[#4C5C54] block mb-1">
              Kategori *
            </label>
            <button
              type="button"
              onClick={() => {
                setCategoryPickerOpen((v) => !v);
                setMethodPickerOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F6F4EF] hover:bg-[#E9EFEA]/60 border border-[#DCD7CA] rounded-xl font-semibold text-[#162620] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>
                  {expCategory === "Fee Instruktur"
                    ? "👨‍🏫"
                    : expCategory === "Perlengkapan Studio"
                      ? "🧘"
                      : expCategory === "Listrik & Air"
                        ? "⚡"
                        : expCategory === "Kebersihan"
                          ? "🧹"
                          : expCategory === "Konsumsi / Air Mineral"
                            ? "💧"
                            : "📝"}
                </span>
                <span>{expCategory}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#5D6E66] transition-transform ${categoryPickerOpen ? "rotate-180" : ""}`}
              />
            </button>
            {categoryPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setCategoryPickerOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#E6E2D8] rounded-2xl shadow-xl z-40 overflow-hidden">
                  {[
                    { label: "Fee Instruktur", emoji: "👨‍🏫" },
                    { label: "Perlengkapan Studio", emoji: "🧘" },
                    { label: "Listrik & Air", emoji: "⚡" },
                    { label: "Kebersihan", emoji: "🧹" },
                    { label: "Konsumsi / Air Mineral", emoji: "💧" },
                    { label: "Lainnya", emoji: "📝" },
                  ].map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => {
                        setExpCategory(cat.label);
                        setCategoryPickerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-left transition-colors cursor-pointer ${
                        expCategory === cat.label
                          ? "bg-[#E9EFEA] text-[#162620] font-bold"
                          : "text-[#162620] hover:bg-[#F6F4EF]"
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span>{cat.label}</span>
                      {expCategory === cat.label && (
                        <span className="ml-auto text-[#4D7762] font-black">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="font-bold text-[#4C5C54] block mb-1">
              Keterangan Pengeluaran *
            </label>
            <input
              type="text"
              required
              placeholder="cth: Beli 2 galon air mineral & tisu"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1">
                Nominal (Rp) *
              </label>
              <input
                type="number"
                min={1000}
                required
                placeholder="50000"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
              />
            </div>
            {/* Modern Sumber Dana Picker */}
            <div className="relative">
              <label className="font-bold text-[#4C5C54] block mb-1">
                Sumber Dana
              </label>
              <div className="flex gap-1.5">
                {[
                  { value: "CASH_STUDIO", label: "Tunai", emoji: "💵" },
                  {
                    value: "TRANSFER_MANUAL",
                    label: "Transfer",
                    emoji: "🏦",
                  },
                  { value: "QRIS_MANUAL", label: "QRIS", emoji: "📱" },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() =>
                      setExpMethod(
                        m.value as
                          "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL",
                      )
                    }
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer border ${
                      expMethod === m.value
                        ? "bg-[#4D7762] text-white border-[#4D7762]"
                        : "bg-[#F6F4EF] text-[#5D6E66] border-[#DCD7CA] hover:border-[#4D7762]"
                    }`}
                  >
                    <span className="text-sm">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSavingExp}
          className="w-full py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSavingExp ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Simpan Pengeluaran
        </button>
      </form>

      {/* Daftar Pengeluaran */}
      <div className="lg:col-span-7 space-y-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8A0]" />
          <input
            type="text"
            placeholder="Cari keterangan atau kategori..."
            value={expSearch}
            onChange={(e) => {
              setExpSearch(e.target.value);
              setExpPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6E2D8] rounded-xl text-xs font-semibold text-[#162620] outline-none focus:ring-2 focus:ring-[#4D7762]"
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#E6E2D8] bg-[#F6F4EF] text-[11px] font-bold uppercase tracking-wider text-[#5D6E66]">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Kategori & Keterangan</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE5] text-xs">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-[#5D6E66]"
                    >
                      Belum ada catatan pengeluaran studio.
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 px-4 font-mono font-bold text-[#162620]">
                        {item.code}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9EFEA] text-[#3B6251] mb-1">
                          {item.category}
                        </span>
                        <div className="font-bold text-[#162620]">
                          {item.description}
                        </div>
                        <div className="text-[10px] text-[#5D6E66]">
                          {new Date(item.date).toLocaleString("id-ID", {
                            timeZone: "Asia/Jakarta",
                          })}{" "}
                          WIB
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F6F4EF] text-[#162620]">
                          {methodLabels[item.method] || item.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-rose-600">
                        - Rp {item.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-[#F0EDE5]">
            {paginatedExpenses.length === 0 ? (
              <div className="py-10 text-center text-[#5D6E66] text-sm">
                Belum ada catatan pengeluaran studio.
              </div>
            ) : (
              paginatedExpenses.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9EFEA] text-[#3B6251] mb-1">
                        {item.category}
                      </span>
                      <p className="font-bold text-sm text-[#162620]">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-[#5D6E66] font-mono">
                        {item.code}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F6F4EF] text-[#162620]">
                      {methodLabels[item.method] || item.method}
                    </span>
                    <span className="font-extrabold text-sm text-rose-600">
                      - Rp {item.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9BA8A0]">
                    {new Date(item.date).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}{" "}
                    WIB
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <Pagination
          currentPage={expPage}
          totalPages={expTotalPages}
          onPageChange={setExpPage}
        />
      </div>
    </div>
  );
}
