"use client";

import { useState, useEffect, useRef } from "react";
import { AdminToast, ToastType } from "@/components/admin/AdminToast";
import {
  CheckCircle2,
  Clock,
  Scan,
  Loader2,
  XCircle,
  Search,
  ImageUp,
} from "lucide-react";
import { processQRCheckIn } from "@/app/actions/admin";
import { Html5Qrcode } from "html5-qrcode";
import { useResponsivePagination } from "@/hooks/useResponsivePagination";
import { Pagination } from "@/components/ui/Pagination";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface ScanResult {
  name: string;
  phone: string;
  bookingCode: string;
  className: string;
  instructor: string;
  startTime: string;
  time: string;
  status: "success" | "already";
}

export default function ScannerClient({
  initialHistory,
}: {
  initialHistory: ScanResult[];
}) {
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(initialHistory);
  const [codeInput, setCodeInput] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const fileScanRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const {
    currentPage,
    totalPages,
    setCurrentPage,
    paginatedData,
    itemsPerPage,
  } = useResponsivePagination(
    scanHistory.filter((s) => {
      const q = historySearch.toLowerCase();
      return (
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.bookingCode.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    }),
  );

  useEffect(() => {
    setScanHistory(initialHistory);
    setCurrentPage(1);
  }, [initialHistory, setCurrentPage]);

  useEffect(() => {
    setMounted(true);
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    const scanConfig = {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const boxSize = Math.max(240, Math.floor(minEdge * 0.85));
        return { width: boxSize, height: boxSize };
      },
    };

    html5QrCode
      .start(
        { facingMode: { exact: "environment" } },
        scanConfig,
        (decodedText) => {
          if (!isProcessingRef.current) handleScanText(decodedText);
        },
        () => {},
      )
      .catch(() => {
        html5QrCode
          .start(
            { facingMode: "user" },
            scanConfig,
            (decodedText) => {
              if (!isProcessingRef.current) handleScanText(decodedText);
            },
            () => {},
          )
          .catch(() => {
            setCameraError(
              "Izinkan akses kamera, upload gambar QR, atau ketik kode booking manual di bawah.",
            );
          });
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, []);

  const handleScanText = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const extractedCode = cleanText.includes("/verify/")
      ? cleanText.split("/verify/")[1].split("?")[0].replace(/\/$/, "")
      : cleanText;

    isProcessingRef.current = true;
    setIsScanning(true);
    setCodeInput(extractedCode);

    const res = await processQRCheckIn(extractedCode);
    setIsScanning(false);

    if (res.success && res.data) {
      const data = res.data as ScanResult;
      setLastScan(data);
      if (data.status === "success") {
        setScanHistory((prev) => [data, ...prev]);
        showToast(`Check-in kelas berhasil: ${data.name}`, "success");
      } else {
        showToast(`${data.name} sudah check-in sebelumnya.`, "success");
      }
      setCodeInput("");
    } else {
      showToast(res.error || "E-Ticket tidak ditemukan.", "error");
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2000);
    }
  };

  const handleCloseModal = () => {
    setLastScan(null);
    isProcessingRef.current = false;
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProcessingRef.current) handleScanText(codeInput);
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileScanner = new Html5Qrcode("qr-file-tmp");
      const decodedText = await fileScanner.scanFile(file, true);
      fileScanner.clear();
      await handleScanText(decodedText);
    } catch {
      showToast("QR Code tidak terbaca pada gambar tersebut.", "error");
    } finally {
      if (fileScanRef.current) fileScanRef.current.value = "";
    }
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6">
      <AdminToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast((s) => ({ ...s, visible: false }))}
      />

      <div>
        <h1 className="text-2xl font-extrabold text-[#162620] tracking-tight">
          Scanner QR E-Ticket
        </h1>
        <p className="text-[#5D6E66] text-sm mt-1">
          Scan QR E-Ticket murid saat tiba di studio atau masukkan kode booking
          (cth: PL-202611-001).
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div
            className="bg-[#162620] rounded-2xl overflow-hidden shadow-xl relative w-full"
            style={{ aspectRatio: "4/3" }}
          >
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-[#9DC0A8]" />
                </div>
                <p className="text-white font-bold text-sm">{cameraError}</p>
              </div>
            ) : (
              <div
                id="qr-reader"
                className="absolute inset-0 w-full h-full [&>*]:!w-full [&>*]:!h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_video]:!max-w-none [&_img]:hidden [&_div[style]]:!border-0 [&_div[style]]:!padding-0"
              />
            )}
            <div id="qr-file-tmp" className="hidden" />

            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                <Loader2 className="w-12 h-12 text-[#9DC0A8] animate-spin mb-4" />
                <p className="text-white font-bold animate-pulse">
                  Memverifikasi E-Ticket...
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleScanSubmit}
            className="flex gap-2 flex-wrap sm:flex-nowrap"
          >
            <input
              type="text"
              placeholder="Ketik Kode Booking (cth: PL-202611-001)..."
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="flex-1 min-w-[180px] bg-white border border-[#DCD7CA] rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#4D7762]"
              disabled={isScanning}
            />
            <input
              ref={fileScanRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />
            <button
              type="button"
              onClick={() => fileScanRef.current?.click()}
              disabled={isScanning}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[#E9EFEA] hover:bg-[#C8E0D5] text-[#2A5040] border border-[#A8C8B8] font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              title="Scan QR dari Screenshot / Gambar"
            >
              <ImageUp className="w-5 h-5" />
              <span className="hidden sm:inline">Scan Gambar</span>
            </button>
            <button
              type="submit"
              disabled={isScanning || !codeInput.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4D7762] hover:bg-[#3B6251] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {isScanning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Scan className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {isScanning ? "Memeriksa..." : "Check-In"}
              </span>
            </button>
          </form>

          {lastScan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#162620]/60 backdrop-blur-sm">
              <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-[#E6E2D8]">
                <div className="p-6 text-center text-white bg-[#254336]">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-9 h-9 text-[#9DC0A8]" />
                  </div>
                  <h3 className="text-xl font-black">
                    {lastScan.status === "already"
                      ? "Sudah Check-in"
                      : "Check-in Berhasil!"}
                  </h3>
                  <p className="text-white/80 text-xs mt-1">
                    {lastScan.className}
                  </p>
                </div>

                <div className="p-6 text-center space-y-4">
                  <div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#F6F4EF] text-[#162620]">
                      {lastScan.bookingCode}
                    </span>
                    <h4 className="text-2xl font-extrabold text-[#162620] mt-2">
                      {lastScan.name}
                    </h4>
                    <p className="text-xs text-[#5D6E66]">
                      Instruktur {lastScan.instructor} • Jam{" "}
                      {lastScan.startTime} WIB
                    </p>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="w-full py-3.5 bg-[#162620] hover:bg-[#3B6251] text-white rounded-xl font-bold text-sm cursor-pointer"
                  >
                    Tutup & Scan Berikutnya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-[#E6E2D8] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E6E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#162620]">
                  Riwayat Check-in
                </h3>
                <p className="text-xs text-[#5D6E66]">
                  Total: {scanHistory.length} hadir
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9BA8A0]" />
                  <input
                    type="text"
                    placeholder="Cari nama, kode..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 pr-3 py-2 sm:py-1.5 bg-white border border-[#E6E2D8] rounded-xl text-xs font-semibold text-[#162620] outline-none focus:ring-2 focus:ring-[#4D7762] w-full sm:w-44"
                  />
                </div>
                <DateRangePicker />
              </div>
            </div>

            <div className="divide-y divide-[#F0EDE5] max-h-[540px] overflow-y-auto">
              {paginatedData.length === 0 ? (
                <div className="p-8 text-center text-[#5D6E66] text-sm">
                  Belum ada murid check-in hari ini.
                </div>
              ) : (
                paginatedData.map((scan, idx) => (
                  <div
                    key={idx}
                    className="px-5 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#162620] truncate">
                        {scan.name}
                      </p>
                      <p className="text-[11px] text-[#5D6E66] truncate">
                        {scan.className} •{" "}
                        <span className="font-mono">{scan.bookingCode}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3B6251] bg-[#E9EFEA] px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        {mounted
                          ? new Date(scan.time).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            })
                          : "--:--"}{" "}
                        WIB
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
