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
  Banknote,
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
import {
  TransactionItem,
  ExpenseItem,
  ScheduleOption,
  PackageOption,
  methodLabels,
} from "./_components/types";
import { VerifyPaymentModal } from "./_components/VerifyPaymentModal";
import { ExpenseTab } from "./_components/ExpenseTab";
import { CashierModal } from "./_components/CashierModal";

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

      <VerifyPaymentModal
        verifyTarget={verifyTarget}
        setVerifyTarget={setVerifyTarget}
        verifyCashReceived={verifyCashReceived}
        setVerifyCashReceived={setVerifyCashReceived}
        isVerifying={isVerifying}
        handleVerify={handleVerify}
      />

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
        <ExpenseTab
          expCategory={expCategory}
          setExpCategory={setExpCategory}
          categoryPickerOpen={categoryPickerOpen}
          setCategoryPickerOpen={setCategoryPickerOpen}
          setMethodPickerOpen={setMethodPickerOpen}
          expDesc={expDesc}
          setExpDesc={setExpDesc}
          expAmount={expAmount}
          setExpAmount={setExpAmount}
          expMethod={expMethod}
          setExpMethod={setExpMethod}
          expSearch={expSearch}
          setExpSearch={setExpSearch}
          isSavingExp={isSavingExp}
          paginatedExpenses={paginatedExpenses}
          expPage={expPage}
          expTotalPages={expTotalPages}
          setExpPage={setExpPage}
          handleCreateExpense={handleCreateExpense}
          handleDeleteExpense={handleDeleteExpense}
        />
      )}

      {/* Modal Transaksi Kasir (Tunai / Non-Cashless / Pilihan Paket) */}
      <CashierModal
        cashierOpen={cashierOpen}
        setCashierOpen={setCashierOpen}
        cashierName={cashierName}
        setCashierName={setCashierName}
        cashierPhone={cashierPhone}
        setCashierPhone={setCashierPhone}
        cashierScheduleId={cashierScheduleId}
        setCashierScheduleId={setCashierScheduleId}
        cashierPackageId={cashierPackageId}
        setCashierPackageId={setCashierPackageId}
        cashierMethod={cashierMethod}
        setCashierMethod={setCashierMethod}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        isSavingCashier={isSavingCashier}
        schedulePickerOpen={schedulePickerOpen}
        setSchedulePickerOpen={setSchedulePickerOpen}
        packagePickerOpen={packagePickerOpen}
        setPackagePickerOpen={setPackagePickerOpen}
        activeSchedules={activeSchedules}
        activePackages={activePackages}
        selectedSchedule={selectedSchedule}
        selectedPackage={selectedPackage}
        cashierAmount={cashierAmount}
        cashChange={cashChange}
        handleSaveCashier={handleSaveCashier}
      />
    </div>
  );
}
