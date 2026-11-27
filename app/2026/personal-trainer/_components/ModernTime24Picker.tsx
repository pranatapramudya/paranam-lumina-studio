"use client";

import { useState, useRef } from "react";
import type React from "react";
import { Clock } from "lucide-react";

const HOURS_24 = Array.from({ length: 16 }, (_, i) =>
  String(i + 6).padStart(2, "0"),
);
const MINUTES_QUICK = ["00", "15", "30", "45"];

export function ModernTime24Picker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hh, mm] = (value || "08:00").split(":");
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});

  const openPicker = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const above = spaceBelow < 220;
      setDropStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 240),
        ...(above
          ? { bottom: window.innerHeight - rect.top + 4, top: "auto" }
          : { top: rect.bottom + 4, bottom: "auto" }),
        zIndex: 9999,
      });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={openPicker}
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
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
          />
          <div
            className="bg-white border border-[#E6E2D8] rounded-2xl shadow-2xl p-3 space-y-2.5 overflow-y-auto"
            style={{ ...dropStyle, maxHeight: 320 }}
          >
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
