"use client";

import { Loader2, X } from "lucide-react";
import { TransactionItem, methodLabels } from "./types";

interface VerifyPaymentModalProps {
  verifyTarget: TransactionItem | null;
  setVerifyTarget: (v: TransactionItem | null) => void;
  verifyCashReceived: string;
  setVerifyCashReceived: (v: string) => void;
  isVerifying: boolean;
  handleVerify: () => void;
}

export function VerifyPaymentModal({
  verifyTarget,
  setVerifyTarget,
  verifyCashReceived,
  setVerifyCashReceived,
  isVerifying,
  handleVerify,
}: VerifyPaymentModalProps) {
  if (!verifyTarget) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#162620]/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E2D8] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#C8E0D5] border-b border-[#A8C8B8] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#1D3D30]">
              Konfirmasi Pembayaran Lunas
            </h3>
            <p className="text-[11px] text-[#3B6251]">
              {verifyTarget.memberName} • {verifyTarget.bookingCode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !isVerifying && setVerifyTarget(null)}
            className="p-1.5 rounded-lg text-[#2A5040] hover:bg-white/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F6F4EF] border border-[#E6E2D8] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5D6E66] block">
                Total Tagihan (
                {methodLabels[verifyTarget.method] || verifyTarget.method})
              </span>
              <span className="text-base font-black text-[#162620]">
                Rp {verifyTarget.amount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Kalkulator Uang Diterima & Kembalian untuk Tunai di Tempat */}
          <div className="p-3.5 rounded-2xl bg-[#E9EFEA] border border-[#C8E0D5] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#2A5040]">
                Uang Tunai Diterima (Rp)
              </label>
              <div className="flex gap-1">
                {[
                  { label: "Pas", val: verifyTarget.amount },
                  { label: "100rb", val: 100000 },
                  { label: "150rb", val: 150000 },
                  { label: "200rb", val: 200000 },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setVerifyCashReceived(String(q.val))}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-[#4D7762] hover:text-white text-[10px] font-bold text-[#2A5040] border border-[#A8C8B8] cursor-pointer transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={verifyCashReceived}
              onChange={(e) => setVerifyCashReceived(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#A8C8B8] rounded-xl font-bold text-sm text-[#162620]"
            />
            <div className="flex items-center justify-between pt-1 border-t border-[#C8E0D5]">
              <span className="font-bold text-[#3B6251]">Uang Kembalian</span>
              <span className="text-base font-black text-[#4D7762]">
                Rp{" "}
                {Math.max(
                  0,
                  (Number(verifyCashReceived) || 0) - verifyTarget.amount,
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isVerifying}
              onClick={() => setVerifyTarget(null)}
              className="flex-1 py-2.5 rounded-xl bg-[#F6F4EF] hover:bg-[#E6E2D8] font-bold text-[#5D6E66] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleVerify}
              className="flex-1 py-2.5 rounded-xl bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
              Acc Lunas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
