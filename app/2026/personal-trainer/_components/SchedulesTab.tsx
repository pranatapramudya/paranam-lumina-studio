"use client";

import type React from "react";
import {
  Loader2,
  Trash2,
  Plus,
  Pencil,
  Search,
  X,
  ImageIcon,
  CopyPlus,
} from "lucide-react";
import { ModernTime24Picker } from "./ModernTime24Picker";
import { ScheduleItem, DAY_OPTIONS, getNextDateForJsDay } from "./types";

interface SchedulesTabProps {
  editingId: string | null;
  resetForm: () => void;
  handleSubmitSchedule: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  photoPreview: string | null;
  isCompressing: boolean;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setPhotoBase64: (v: string | null) => void;
  setPhotoPreview: (v: string | null) => void;
  title: string;
  setTitle: (v: string) => void;
  instructor: string;
  setInstructor: (v: string) => void;
  bookingInstructors: string[];
  category: string;
  setCategory: (v: string) => void;
  dateStr: string;
  setDateStr: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  price: number;
  setPrice: (v: number) => void;
  maxCapacity: number;
  setMaxCapacity: (v: number) => void;
  isAdding: boolean;
  jadwalSearch: string;
  setJadwalSearch: (v: string) => void;
  handleCloneNextWeek: () => void;
  isCloning: boolean;
  filteredSchedules: ScheduleItem[];
  startEdit: (s: ScheduleItem) => void;
  handleDeleteSchedule: (id: string) => void;
  formatWibDate: (iso: string) => string;
  formatWibTime: (t: string) => string;
}

export function SchedulesTab({
  editingId,
  resetForm,
  handleSubmitSchedule,
  fileInputRef,
  photoPreview,
  isCompressing,
  handlePhotoChange,
  setPhotoBase64,
  setPhotoPreview,
  title,
  setTitle,
  instructor,
  setInstructor,
  bookingInstructors,
  category,
  setCategory,
  dateStr,
  setDateStr,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  price,
  setPrice,
  maxCapacity,
  setMaxCapacity,
  isAdding,
  jadwalSearch,
  setJadwalSearch,
  handleCloneNextWeek,
  isCloning,
  filteredSchedules,
  startEdit,
  handleDeleteSchedule,
  formatWibDate,
  formatWibTime,
}: SchedulesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form Tambah / Edit */}
      <form
        id="class-form"
        onSubmit={handleSubmitSchedule}
        className="lg:col-span-4 bg-white rounded-2xl border border-[#E6E2D8] p-4 sm:p-6 shadow-sm space-y-5"
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

        <div className="space-y-4 text-xs">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1.5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1.5">
                Jam Mulai{" "}
                <span className="text-[#4D7762] font-bold">(WIB)</span>
              </label>
              <ModernTime24Picker value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1">
                Jam Selesai{" "}
                <span className="text-[#4D7762] font-bold">(WIB)</span>
              </label>
              <ModernTime24Picker value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#4C5C54] block mb-1.5">
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
      <div className="lg:col-span-8 space-y-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {s.instructorPhoto ? (
                  <div className="relative">
                    <img
                      src={s.instructorPhoto}
                      alt={s.title}
                      className="w-full h-28 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {formatWibTime(s.startTime)} – {formatWibTime(s.endTime)}
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
                      <strong className="text-[#162620]">{s.instructor}</strong>
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
  );
}
