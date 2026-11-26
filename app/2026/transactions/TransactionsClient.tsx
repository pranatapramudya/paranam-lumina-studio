"use client";

import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { AdminToast, ToastType } from "@/components/admin/AdminToast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Printer,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  Trash2,
  Loader2,
  Banknote,
  X,
  ChevronDown,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import {
  confirmBookingPayment,
  createStudioExpense,
  deleteStudioExpense,
  createCashierBooking,
} from "@/app/actions/admin";
import { useResponsivePagination } from "@/hooks/useResponsivePagination";
import { Pagination } from "@/components/ui/Pagination";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TransactionItem {
  id: string;
  bookingCode: string;
  memberName: string;
  memberPhone: string;
  type: string;
  amount: number;
  method: string;
  status: "PENDING" | "PAID" | "REJECTED";
  date: string;
}

interface ExpenseItem {
  id: string;
  code: string;
  category: string;
  description: string;
  amount: number;
  method: string;
  date: string;
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PAID: {
    icon: CheckCircle2,
    label: "Lunas",
    className: "bg-[#E9EFEA] text-[#254336] border-[#D4E2D7]",
  },
  REJECTED: {
    icon: XCircle,
    label: "Batal / Expired",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const methodLabels: Record<string, string> = {
  QRIS_MANUAL: "QRIS",
  TRANSFER_MANUAL: "Transfer BCA",
  CASH_STUDIO: "Tunai Studio",
  PACKAGE_CREDIT: "Credit",
};

const EXPENSE_CATEGORIES = [
  "Fee Instruktur",
  "Perlengkapan Studio",
  "Listrik & Air",
  "Kebersihan",
  "Konsumsi / Air Mineral",
  "Lainnya",
];

interface ScheduleOption {
  id: string;
  title: string;
  instructor: string;
  dateLabel: string;
  startTime: string;
  price: number;
  remaining: number;
}

interface PackageOption {
  id: string;
  name: string;
  price: number;
  totalSessions: number;
}

export default function TransactionsClient({
  initialTransactions,
  initialExpenses,
  activeSchedules = [],
  activePackages = [],
}: {
  initialTransactions: TransactionItem[];
  initialExpenses: ExpenseItem[];
  activeSchedules?: ScheduleOption[];
  activePackages?: PackageOption[];
}) {
  const [activeTab, setActiveTab] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [transactions, setTransactions] =
    useState<TransactionItem[]>(initialTransactions);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as ToastType,
  });
  const [verifyTarget, setVerifyTarget] = useState<TransactionItem | null>(
    null,
  );
  const [verifyCashReceived, setVerifyCashReceived] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "PAID" | "REJECTED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Expense form state
  const [expCategory, setExpCategory] = useState("Perlengkapan Studio");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expMethod, setExpMethod] = useState<
    "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL"
  >("CASH_STUDIO");
  const [expSearch, setExpSearch] = useState("");
  const [isSavingExp, setIsSavingExp] = useState(false);

  // Cashier Walk-in / Tunai Modal state
  const [cashierOpen, setCashierOpen] = useState(false);
  const [cashierName, setCashierName] = useState("");
  const [cashierPhone, setCashierPhone] = useState("");
  const [cashierScheduleId, setCashierScheduleId] = useState(
    activeSchedules[0]?.id || "",
  );
  const [cashierPackageId, setCashierPackageId] = useState<string>("DROP_IN");
  const [cashierMethod, setCashierMethod] = useState<
    "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL"
  >("CASH_STUDIO");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isSavingCashier, setIsSavingCashier] = useState(false);
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
  const [packagePickerOpen, setPackagePickerOpen] = useState(false);

  const selectedSchedule = activeSchedules.find(
    (s) => s.id === cashierScheduleId,
  );
  const selectedPackage = activePackages.find((p) => p.id === cashierPackageId);
  const cashierAmount = selectedPackage
    ? selectedPackage.price
    : selectedSchedule?.price || 90000;
  const cashChange = Math.max(0, (Number(cashReceived) || 0) - cashierAmount);

  const handleSaveCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCashier(true);
    const res = await createCashierBooking({
      customerName: cashierName,
      customerPhone: cashierPhone,
      scheduleId: cashierScheduleId,
      packageName: selectedPackage ? selectedPackage.name : undefined,
      amount: cashierAmount,
      paymentMethod: cashierMethod,
    });
    setIsSavingCashier(false);
    if (res.success && res.transaction) {
      setTransactions((prev) => [res.transaction!, ...prev]);
      setCashierOpen(false);
      setCashierName("");
      setCashierPhone("");
      setCashReceived("");
      showToast(
        `Pembayaran kasir ${res.transaction.memberName} (${res.transaction.bookingCode}) tercatat Lunas!`,
        "success",
      );
    } else {
      showToast(res.error || "Gagal menyimpan transaksi kasir", "error");
    }
  };

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const handleVerify = async () => {
    if (!verifyTarget) return;
    setIsVerifying(true);
    const res = await confirmBookingPayment(verifyTarget.id);
    setIsVerifying(false);

    if (res.success) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === verifyTarget.id ? { ...t, status: "PAID" } : t,
        ),
      );
      showToast(
        `Pembayaran ${verifyTarget.memberName} berhasil dikonfirmasi Lunas.`,
        "success",
      );
      setVerifyTarget(null);
    } else {
      showToast(res.error || "Gagal memverifikasi", "error");
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingExp(true);
    const res = await createStudioExpense({
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount),
      paymentMethod: expMethod,
    });
    setIsSavingExp(false);
    if (res.success && res.expense) {
      setExpenses((prev) => [res.expense!, ...prev]);
      setExpDesc("");
      setExpAmount("");
      showToast("Pengeluaran kasir berhasil dicatat.", "success");
    } else {
      showToast(res.error || "Gagal menyimpan pengeluaran", "error");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const res = await deleteStudioExpense(id);
    if (res.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast("Catatan pengeluaran dihapus.", "success");
    } else {
      showToast(res.error || "Gagal menghapus", "error");
    }
  };

  const totalIncome = transactions
    .filter((t) => t.status === "PAID")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions =
    filterStatus === "ALL"
      ? transactions
      : transactions.filter((t) => t.status === filterStatus);

  const searchedTransactions = filteredTransactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      t.memberName.toLowerCase().includes(q) ||
      t.bookingCode.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.memberPhone.includes(q)
    );
  });

  const searchedExpenses = expenses.filter((e) => {
    const q = expSearch.toLowerCase();
    return (
      !q ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q)
    );
  });

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(
      activeTab === "INCOME"
        ? "Laporan Pemasukan Paranam Lumina Studio"
        : "Laporan Pengeluaran Paranam Lumina Studio",
      14,
      15,
    );
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

    if (activeTab === "INCOME") {
      autoTable(doc, {
        startY: 28,
        head: [
          [
            "No",
            "Kode Booking",
            "Pemesan",
            "Kelas",
            "Nominal",
            "Metode",
            "Status",
            "Waktu",
          ],
        ],
        body: searchedTransactions.map((item, idx) => [
          idx + 1,
          item.bookingCode,
          item.memberName,
          item.type,
          `Rp ${item.amount.toLocaleString("id-ID")}`,
          methodLabels[item.method] || item.method,
          statusConfig[item.status]?.label || item.status,
          new Date(item.date).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          }),
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [77, 119, 98] },
      });
    } else {
      autoTable(doc, {
        startY: 28,
        head: [
          [
            "No",
            "Kode",
            "Kategori",
            "Keterangan",
            "Nominal",
            "Metode",
            "Waktu",
          ],
        ],
        body: searchedExpenses.map((item, idx) => [
          idx + 1,
          item.code,
          item.category,
          item.description,
          `Rp ${item.amount.toLocaleString("id-ID")}`,
          methodLabels[item.method] || item.method,
          new Date(item.date).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          }),
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [77, 119, 98] },
      });
    }

    window.open(doc.output("bloburl"), "_blank");
  };

  const {
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage,
    paginatedData,
  } = useResponsivePagination(searchedTransactions);

  const {
    currentPage: expPage,
    totalPages: expTotalPages,
    setCurrentPage: setExpPage,
    paginatedData: paginatedExpenses,
  } = useResponsivePagination(searchedExpenses);

  const pendingCount = transactions.filter(
    (t) => t.status === "PENDING",
  ).length;

  const columns = [
    {
      key: "no",
      label: "NO",
      render: (_item: TransactionItem, index: number) => (
        <span className="text-sm font-medium text-slate-500">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </span>
      ),
    },
    {
      key: "bookingCode",
      label: "Kode",
      render: (item: TransactionItem) => (
        <span className="text-xs font-mono font-bold text-[#162620]">
          {item.bookingCode}
        </span>
      ),
    },
    {
      key: "memberName",
      label: "Pemesan",
      render: (item: TransactionItem) => (
        <div>
          <p className="text-sm font-semibold text-[#162620]">
            {item.memberName}
          </p>
          <p className="text-[11px] text-[#5D6E66]">{item.memberPhone}</p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Kelas",
      render: (item: TransactionItem) => (
        <span className="text-xs font-medium text-slate-700">{item.type}</span>
      ),
    },
    {
      key: "amount",
      label: "Nominal",
      render: (item: TransactionItem) => (
        <span className="text-sm font-bold text-[#162620]">
          Rp {item.amount.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "method",
      label: "Metode",
      render: (item: TransactionItem) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F6F4EF] text-[#162620]">
          {methodLabels[item.method] || item.method}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: TransactionItem) => {
        const config = statusConfig[item.status] || statusConfig.PENDING;
        const Icon = config.icon;
        return (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.className}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Aksi",
      className: "text-right",
      render: (item: TransactionItem) => (
        <div className="flex justify-end">
          {item.status === "PENDING" ? (
            <button
              onClick={() => {
                setVerifyTarget(item);
                setVerifyCashReceived(String(item.amount));
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#4D7762] rounded-lg hover:bg-[#3B6251] transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Acc Lunas
            </button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6">
      <AdminToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast((s) => ({ ...s, visible: false }))}
      />

      {verifyTarget && (
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
                  <span className="font-bold text-[#3B6251]">
                    Uang Kembalian
                  </span>
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
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#162620] tracking-tight">
            Kas & Keuangan Studio
          </h1>
          <p className="text-[#5D6E66] text-sm mt-1">
            Pantau pemasukan booking & catat pengeluaran operasional studio.
            {pendingCount > 0 && (
              <span className="ml-1.5 text-amber-600 font-semibold">
                · {pendingCount} menunggu konfirmasi
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker />
          <button
            onClick={() => setCashierOpen(true)}
            className="px-4 py-2 bg-[#4D7762] hover:bg-[#3B6251] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Banknote className="w-4 h-4" />+ Bayar di Kasir (Tunai/Paket)
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-white hover:bg-[#E9EFEA] text-[#2A5040] border border-[#C8E0D5] rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Ringkasan Pemasukan vs Pengeluaran */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#E6E2D8] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E9EFEA] text-[#4D7762] flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#5D6E66]">
              Pemasukan Lunas
            </p>
            <p className="text-lg font-extrabold text-[#162620]">
              Rp {totalIncome.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6E2D8] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#5D6E66]">
              Total Pengeluaran
            </p>
            <p className="text-lg font-extrabold text-rose-600">
              Rp {totalExpense.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#C8E0D5] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#4D7762] text-white flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#5D6E66]">
              Kas Bersih (Net)
            </p>
            <p
              className={`text-lg font-extrabold ${netBalance >= 0 ? "text-[#4D7762]" : "text-rose-600"}`}
            >
              Rp {netBalance.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Pemasukan vs Pengeluaran */}
      <div className="flex items-center gap-2 border-b border-[#E6E2D8] pb-3">
        <button
          onClick={() => setActiveTab("INCOME")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "INCOME"
              ? "bg-[#4D7762] text-white shadow-sm"
              : "bg-white text-[#5D6E66] border border-[#E6E2D8] hover:border-[#4D7762]"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Pemasukan Booking ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("EXPENSE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "EXPENSE"
              ? "bg-[#4D7762] text-white shadow-sm"
              : "bg-white text-[#5D6E66] border border-[#E6E2D8] hover:border-[#4D7762]"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Pengeluaran Kasir ({expenses.length})
        </button>
      </div>

      {/* TAB 1: PEMASUKAN */}
      {activeTab === "INCOME" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA8A0]" />
              <input
                type="text"
                placeholder="Cari nama, kode, kelas, WA..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6E2D8] rounded-xl text-xs font-semibold text-[#162620] outline-none focus:ring-2 focus:ring-[#4D7762]"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-[#7A8881]" />
              {(["ALL", "PENDING", "PAID", "REJECTED"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterStatus === status
                        ? "bg-[#4D7762] text-white"
                        : "bg-white border border-[#E6E2D8] text-[#5D6E66] hover:border-[#4D7762]"
                    }`}
                  >
                    {status === "ALL" ? "Semua" : statusConfig[status].label}
                  </button>
                ),
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={paginatedData}
            emptyMessage="Belum ada pembayaran"
            emptyDescription="Pembayaran dari checkout kelas konsumen akan muncul di sini."
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* TAB 2: PENGELUARAN KASIR */}
      {activeTab === "EXPENSE" && (
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
                        onClick={() => setExpMethod(m.value as any)}
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
      )}

      {/* Modal Transaksi Kasir (Tunai / Non-Cashless / Pilihan Paket) */}
      {cashierOpen && (
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
                    <span className="font-normal text-[#7A8881]">
                      (Opsional)
                    </span>
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
                        {selectedSchedule.dateLabel} •{" "}
                        {selectedSchedule.startTime} WIB •{" "}
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
                                {s.dateLabel} • {s.startTime} WIB •{" "}
                                {s.instructor}
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
                      onClick={() => setCashierMethod(m.id as any)}
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
                  <span className="font-bold text-[#2A5040]">
                    Total Tagihan
                  </span>
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
                  {isSavingCashier && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Catat Lunas & Terbitkan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
