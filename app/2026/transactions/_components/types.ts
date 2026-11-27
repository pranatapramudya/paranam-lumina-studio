export interface TransactionItem {
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

export interface ExpenseItem {
  id: string;
  code: string;
  category: string;
  description: string;
  amount: number;
  method: string;
  date: string;
}

export interface ScheduleOption {
  id: string;
  title: string;
  instructor: string;
  dateLabel: string;
  startTime: string;
  price: number;
  remaining: number;
}

export interface PackageOption {
  id: string;
  name: string;
  price: number;
  totalSessions: number;
}

export const methodLabels: Record<string, string> = {
  QRIS_MANUAL: "QRIS",
  TRANSFER_MANUAL: "Transfer BCA",
  CASH_STUDIO: "Tunai Studio",
  PACKAGE_CREDIT: "Credit",
};
