"use client";

import type React from "react";
import { Loader2, Trash2, Plus, Pencil, X } from "lucide-react";
import { ToastType } from "@/components/admin/AdminToast";
import {
  createStudioPackage,
  updateStudioPackage,
  deleteStudioPackage,
} from "@/app/actions/admin";
import { PackageItem } from "./types";

interface PackagesTabProps {
  packages: PackageItem[];
  setPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>;
  editingPkgId: string | null;
  setEditingPkgId: (v: string | null) => void;
  pkgName: string;
  setPkgName: (v: string) => void;
  pkgDesc: string;
  setPkgDesc: (v: string) => void;
  pkgPrice: number;
  setPkgPrice: (v: number) => void;
  pkgSessions: number;
  setPkgSessions: (v: number) => void;
  pkgValidity: number;
  setPkgValidity: (v: number) => void;
  isSavingPkg: boolean;
  setIsSavingPkg: (v: boolean) => void;
  showToast: (message: string, type?: ToastType) => void;
}

export function PackagesTab({
  packages,
  setPackages,
  editingPkgId,
  setEditingPkgId,
  pkgName,
  setPkgName,
  pkgDesc,
  setPkgDesc,
  pkgPrice,
  setPkgPrice,
  pkgSessions,
  setPkgSessions,
  pkgValidity,
  setPkgValidity,
  isSavingPkg,
  setIsSavingPkg,
  showToast,
}: PackagesTabProps) {
  const resetPkgForm = () => {
    setEditingPkgId(null);
    setPkgName("");
    setPkgDesc("");
    setPkgPrice(90000);
    setPkgSessions(1);
    setPkgValidity(30);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form
        id="pkg-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setIsSavingPkg(true);
          if (editingPkgId) {
            const res = await updateStudioPackage(editingPkgId, {
              name: pkgName,
              description: pkgDesc,
              price: pkgPrice,
              totalSessions: pkgSessions,
              validityDays: pkgValidity,
            });
            setIsSavingPkg(false);
            if (res.success && res.pkg) {
              setPackages((prev) =>
                prev.map((p) => (p.id === editingPkgId ? res.pkg! : p)),
              );
              resetPkgForm();
              showToast("Paket & tarif diperbarui.", "success");
            } else showToast(res.error || "Gagal update paket", "error");
          } else {
            const res = await createStudioPackage({
              name: pkgName,
              description: pkgDesc,
              price: pkgPrice,
              totalSessions: pkgSessions,
              validityDays: pkgValidity,
            });
            setIsSavingPkg(false);
            if (res.success && res.pkg) {
              setPackages((prev) => [...prev, res.pkg!]);
              resetPkgForm();
              showToast("Paket baru ditambahkan ke Kasir.", "success");
            } else showToast(res.error || "Gagal menambah paket", "error");
          }
        }}
        className="lg:col-span-4 bg-white rounded-2xl border border-[#E6E2D8] p-4 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#162620] flex items-center gap-2">
            {editingPkgId ? (
              <Pencil className="w-4 h-4 text-[#4D7762]" />
            ) : (
              <Plus className="w-4 h-4 text-[#4D7762]" />
            )}
            {editingPkgId ? "Edit Paket / Tarif" : "Tambah Paket / Tarif"}
          </h2>
          {editingPkgId && (
            <button
              type="button"
              onClick={resetPkgForm}
              className="text-xs text-[#5D6E66] hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Batal
            </button>
          )}
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-[#4C5C54] block mb-1.5">
              Nama Paket / Tarif *
            </label>
            <input
              type="text"
              required
              placeholder="cth: Pass 5 Sesi Lumina Flow"
              value={pkgName}
              onChange={(e) => setPkgName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
            />
          </div>

          <div>
            <label className="font-bold text-[#4C5C54] block mb-1.5">
              Harga Paket (Rp) *
            </label>
            <input
              type="number"
              min={1000}
              required
              value={pkgPrice}
              onChange={(e) => setPkgPrice(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1.5">
                Jumlah Sesi
              </label>
              <input
                type="number"
                min={1}
                required
                value={pkgSessions}
                onChange={(e) => setPkgSessions(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
              />
            </div>
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1.5">
                Masa Aktif (Hari)
              </label>
              <input
                type="number"
                min={1}
                required
                value={pkgValidity}
                onChange={(e) => setPkgValidity(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#4C5C54] block mb-1.5">
              Keterangan Singkat
            </label>
            <input
              type="text"
              placeholder="cth: Berlaku untuk semua kelas Yoga"
              value={pkgDesc}
              onChange={(e) => setPkgDesc(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#DCD7CA] rounded-xl font-semibold text-[#162620]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSavingPkg}
          className="w-full py-3 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSavingPkg ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : editingPkgId ? (
            <Pencil className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {editingPkgId ? "Update Paket" : "Simpan Paket ke Kasir"}
        </button>
      </form>

      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {packages.length === 0 ? (
          <div className="sm:col-span-2 py-10 text-center text-[#5D6E66] text-sm bg-white rounded-2xl border border-[#E6E2D8]">
            Belum ada paket tarif. Tambahkan di form sebelah.
          </div>
        ) : (
          packages.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3 ${
                editingPkgId === p.id
                  ? "border-[#4D7762] ring-2 ring-[#4D7762]/30"
                  : "border-[#E6E2D8]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7762] bg-[#E9EFEA] px-2.5 py-0.5 rounded-full">
                    {p.totalSessions} Sesi Studio • {p.validityDays} Hari
                  </span>
                  <h3 className="text-sm font-extrabold text-[#162620] mt-2">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-[#5D6E66] mt-0.5">
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPkgId(p.id);
                      setPkgName(p.name);
                      setPkgDesc(p.description);
                      setPkgPrice(p.price);
                      setPkgSessions(p.totalSessions);
                      setPkgValidity(p.validityDays);
                      document
                        .getElementById("pkg-form")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-[#5D6E66] hover:text-[#4D7762] p-1 cursor-pointer"
                    title="Edit Paket"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await deleteStudioPackage(p.id);
                      if (res.success) {
                        setPackages((prev) =>
                          prev.filter((item) => item.id !== p.id),
                        );
                        showToast("Paket dihapus.", "success");
                      } else {
                        showToast(res.error || "Gagal menghapus", "error");
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Hapus Paket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="pt-3 border-t border-[#F0EDE5] flex items-center justify-between text-xs">
                <span className="font-extrabold text-sm text-[#162620]">
                  Rp {p.price.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] font-bold text-[#4D7762]">
                  Tampil di Kasir
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
