export interface BookingItem {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  className: string;
  instructor: string;
  scheduleDateIso: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  attendanceStatus: string;
  createdAtIso: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  category: string;
  instructor: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  price: number;
  maxCapacity: number;
  bookedCount: number;
  room: string;
  instructorPhoto?: string;
}

export interface PackageItem {
  id: string;
  name: string;
  description: string;
  price: number;
  totalSessions: number;
  validityDays: number;
  isActive: boolean;
}

export const METHOD_LABEL: Record<string, string> = {
  QRIS_MANUAL: "QRIS",
  TRANSFER_MANUAL: "Transfer BCA",
  CASH_STUDIO: "Tunai Studio",
  PACKAGE_CREDIT: "Credit",
};

export const DAY_OPTIONS = [
  { label: "Senin", jsDay: 1 },
  { label: "Selasa", jsDay: 2 },
  { label: "Rabu", jsDay: 3 },
  { label: "Kamis", jsDay: 4 },
  { label: "Jumat", jsDay: 5 },
  { label: "Sabtu", jsDay: 6 },
  { label: "Minggu", jsDay: 0 },
];

export function getNextDateForJsDay(targetJsDay: number): string {
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const currentJsDay = nowWib.getUTCDay();
  const diff = (targetJsDay - currentJsDay + 7) % 7;
  const target = new Date(nowWib.getTime() + diff * 24 * 60 * 60 * 1000);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(
    target.getUTCDate(),
  ).padStart(2, "0")}`;
}

export async function compressImage(
  file: File,
  maxPx = 800,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
