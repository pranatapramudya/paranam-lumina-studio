"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

const PAYMENT_DEADLINE_MS = 15 * 60 * 1000; // 15 menit tenggat waktu pembayaran

function getClassImage(
  title: string,
  category: string,
  photo?: string | null,
): string {
  if (
    photo &&
    (photo.startsWith("data:image/") || photo.startsWith("/images/classes/"))
  ) {
    return photo;
  }
  const combined = `${title} ${category}`.toLowerCase();
  if (
    combined.includes("pilates") ||
    combined.includes("sculpt") ||
    combined.includes("core")
  ) {
    return "/images/classes/pilates.jpg";
  }
  if (
    combined.includes("sound") ||
    combined.includes("meditation") ||
    combined.includes("yin") ||
    combined.includes("restorative") ||
    combined.includes("therapy")
  ) {
    return "/images/classes/sound-healing.jpg";
  }
  return "/images/classes/yoga.jpg";
}

function normalizePhoneVariants(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return { clean: "", variants: [] as string[] };
  const variants = new Set<string>([digits]);
  if (digits.startsWith("0")) {
    variants.add("62" + digits.slice(1));
  } else if (digits.startsWith("62")) {
    variants.add("0" + digits.slice(2));
  }
  const clean = digits.startsWith("62") ? "0" + digits.slice(2) : digits;
  return { clean, variants: Array.from(variants) };
}

function getJakartaDayAndDate(date: Date) {
  const dayOfWeek = date.toLocaleDateString("id-ID", {
    weekday: "long",
    timeZone: "Asia/Jakarta",
  });
  const shortDate = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
  return { dayOfWeek, shortDate };
}

export interface PublicPackageItem {
  id: string;
  name: string;
  description: string;
  price: number;
  totalSessions: number;
  validityDays: number;
}

export interface StudioInfo {
  studioName: string;
  tagline: string;
  address: string;
  whatsappNumber: string;
  bcaAccountNumber: string;
  bcaAccountName: string;
}

export interface PublicSlotItem {
  id: string;
  dayOfWeek: string;
  shortDate: string;
  targetDate: string;
  startTime: string;
  endTime: string;
  className: string;
  category: string;
  description: string | null;
  instructorName: string;
  room: string;
  imageUrl: string;
  price: number;
  currentBookings: number;
  maxCapacity: number;
  isFull: boolean;
}

async function expireStaleGuestHolds() {
  const deadlineCutoff = new Date(Date.now() - PAYMENT_DEADLINE_MS);
  await prisma.booking.updateMany({
    where: {
      notes: "GUEST_HOLD",
      paymentStatus: "PENDING",
      attendanceStatus: "PENDING",
      createdAt: { lt: deadlineCutoff },
    },
    data: {
      paymentStatus: "REJECTED",
      attendanceStatus: "CANCELLED",
    },
  });
}

export async function getPublicSchedule(): Promise<{
  success: boolean;
  slots: PublicSlotItem[];
  packages: PublicPackageItem[];
  studioInfo: StudioInfo;
  error?: string;
}> {
  try {
    await expireStaleGuestHolds();

    const jakartaOffset = 7 * 60 * 60 * 1000;
    const nowWib = new Date(Date.now() + jakartaOffset);
    const todayWibMidnight = new Date(
      Date.UTC(
        nowWib.getUTCFullYear(),
        nowWib.getUTCMonth(),
        nowWib.getUTCDate(),
        0,
        0,
        0,
      ) - jakartaOffset,
    );

    const [schedules, studio, packagesRaw] = await Promise.all([
      prisma.classSchedule.findMany({
        where: {
          status: "UPCOMING",
          date: { gte: todayWibMidnight },
        },
        include: {
          bookings: {
            where: {
              attendanceStatus: { not: "CANCELLED" },
              paymentStatus: { not: "REJECTED" },
            },
            select: { id: true },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
      prisma.studioSetting.findFirst(),
      prisma.package.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
      }),
    ]);

    const nowWibStr = `${nowWib.getUTCFullYear()}-${String(nowWib.getUTCMonth() + 1).padStart(2, "0")}-${String(nowWib.getUTCDate()).padStart(2, "0")}`;
    const nowWibTime = `${String(nowWib.getUTCHours()).padStart(2, "0")}:${String(nowWib.getUTCMinutes()).padStart(2, "0")}`;

    const slots: PublicSlotItem[] = schedules
      .filter((s) => {
        const sWib = new Date(s.date.getTime() + jakartaOffset);
        const sDateStr = `${sWib.getUTCFullYear()}-${String(sWib.getUTCMonth() + 1).padStart(2, "0")}-${String(sWib.getUTCDate()).padStart(2, "0")}`;
        if (sDateStr < nowWibStr) return false;
        if (sDateStr === nowWibStr && s.startTime <= nowWibTime) return false;
        return true;
      })
      .map((s) => {
        const { dayOfWeek, shortDate } = getJakartaDayAndDate(s.date);
        const currentBookings = s.bookings.length;
        return {
          id: s.id,
          dayOfWeek,
          shortDate,
          targetDate: s.date.toISOString(),
          startTime: s.startTime,
          endTime: s.endTime,
          className: s.title,
          category: s.category,
          description: s.description,
          instructorName: s.instructor,
          room: s.room,
          imageUrl: getClassImage(s.title, s.category, s.instructorPhoto),
          price: s.price,
          currentBookings,
          maxCapacity: s.maxCapacity,
          isFull: currentBookings >= s.maxCapacity,
        };
      });

    const studioInfo: StudioInfo = {
      studioName: studio?.studioName || "Paranam Lumina Studio",
      tagline: studio?.tagline || "Yoga, Pilates & Sound Healing",
      address: studio?.address || "Depok, Jawa Barat",
      whatsappNumber: studio?.whatsappNumber || "6281234567890",
      bcaAccountNumber: studio?.bcaAccountNumber || "7140982311",
      bcaAccountName: studio?.bcaAccountName || "Paranam Lumina Studio",
    };

    const packages: PublicPackageItem[] = packagesRaw.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: p.price,
      totalSessions: p.totalSessions,
      validityDays: p.validityDays,
    }));

    return { success: true, slots, studioInfo, packages };
  } catch (error: any) {
    return {
      success: false,
      slots: [],
      packages: [],
      studioInfo: {
        studioName: "Paranam Lumina Studio",
        tagline: "Yoga, Pilates & Sound Healing",
        address: "Depok, Jawa Barat",
        whatsappNumber: "6281234567890",
        bcaAccountNumber: "7140982311",
        bcaAccountName: "Paranam Lumina Studio",
      },
      error: error.message,
    };
  }
}

export interface GuestBookingResult {
  id: string;
  bookingCode: string;
  memberName: string;
  phoneNumber: string;
  className: string;
  instructorName: string;
  dayOfWeek: string;
  shortDate: string;
  scheduleIso: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentMethod: "QRIS" | "TRANSFER" | "TUNAI";
  status: string;
  expiresAtIso: string;
}

const METHOD_TO_DB: Record<"QRIS" | "TRANSFER" | "TUNAI", PaymentMethod> = {
  QRIS: "QRIS_MANUAL",
  TRANSFER: "TRANSFER_MANUAL",
  TUNAI: "CASH_STUDIO",
};

const DB_TO_METHOD_LABEL: Record<string, "QRIS" | "TRANSFER" | "TUNAI"> = {
  QRIS_MANUAL: "QRIS",
  TRANSFER_MANUAL: "TRANSFER",
  CASH_STUDIO: "TUNAI",
  PACKAGE_CREDIT: "TUNAI",
};

export async function createGuestBooking(input: {
  slotId: string;
  name: string;
  phoneNumber: string;
  paymentMethod: "QRIS" | "TRANSFER" | "TUNAI";
}): Promise<{
  success: boolean;
  booking?: GuestBookingResult;
  error?: string;
}> {
  try {
    const cleanName = input.name.trim();
    if (cleanName.length < 2) {
      return {
        success: false,
        error: "Masukkan nama lengkap minimal 2 huruf.",
      };
    }

    const { clean: cleanPhone, variants } = normalizePhoneVariants(
      input.phoneNumber,
    );
    if (cleanPhone.length < 8) {
      return { success: false, error: "Nomor WhatsApp tidak valid." };
    }

    await expireStaleGuestHolds();

    const schedule = await prisma.classSchedule.findUnique({
      where: { id: input.slotId },
    });

    if (!schedule) {
      return { success: false, error: "Jadwal kelas tidak ditemukan." };
    }

    const bookedCount = await prisma.booking.count({
      where: {
        scheduleId: schedule.id,
        attendanceStatus: { not: "CANCELLED" },
        paymentStatus: { not: "REJECTED" },
      },
    });

    if (bookedCount >= schedule.maxCapacity) {
      return {
        success: false,
        error: "Mohon maaf, kuota matras untuk kelas ini baru saja penuh.",
      };
    }

    const dbMethod = METHOD_TO_DB[input.paymentMethod] || "QRIS_MANUAL";

    const result = await prisma.$transaction(async (tx) => {
      let member = await tx.user.findFirst({
        where: { phone: { in: variants } },
      });

      if (!member) {
        member = await tx.user.create({
          data: {
            name: cleanName,
            phone: cleanPhone,
            pin: "123456",
            role: "MEMBER",
          },
        });
      } else if (
        cleanName &&
        member.name !== cleanName &&
        member.role === "MEMBER"
      ) {
        member = await tx.user.update({
          where: { id: member.id },
          data: { name: cleanName },
        });
      }

      const duplicate = await tx.booking.findFirst({
        where: {
          userId: member.id,
          scheduleId: schedule.id,
          attendanceStatus: { not: "CANCELLED" },
          paymentStatus: { not: "REJECTED" },
        },
      });

      if (duplicate) {
        throw new Error(
          "Nomor WhatsApp ini sudah terdaftar di kelas yang sama. Cek di E-Ticket Saya.",
        );
      }

      const MAX_PENDING_PER_USER = 2;
      const pendingCount = await tx.booking.count({
        where: {
          userId: member.id,
          paymentStatus: "PENDING",
          attendanceStatus: "PENDING",
        },
      });
      if (pendingCount >= MAX_PENDING_PER_USER) {
        throw new Error(
          `Maksimal ${MAX_PENDING_PER_USER} pesanan menunggu pembayaran dalam waktu bersamaan. Selesaikan atau batalkan pesanan sebelumnya di E-Ticket Saya.`,
        );
      }

      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const existingCount = await tx.booking.count();
      const seq = String(existingCount + 1).padStart(3, "0");
      const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
      const bookingCode = `PL-${ym}-${seq}-${suffix}`;
      const invoiceNumber = `INV-${ym}-${seq}-${suffix}`;

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId: member.id,
          scheduleId: schedule.id,
          paymentMethod: dbMethod,
          paymentStatus: "PENDING",
          attendanceStatus: "PENDING",
          amount: schedule.price,
          notes: "GUEST_HOLD",
        },
      });

      await tx.transaction.create({
        data: {
          invoiceNumber,
          userId: member.id,
          type: `KELAS: ${schedule.title}`,
          amount: schedule.price,
          paymentMethod: dbMethod,
          status: "PENDING",
        },
      });

      return { member, booking };
    });

    const { dayOfWeek, shortDate } = getJakartaDayAndDate(schedule.date);
    const expiresAtIso = new Date(
      result.booking.createdAt.getTime() + PAYMENT_DEADLINE_MS,
    ).toISOString();

    revalidatePath("/");
    revalidatePath("/jadwal");
    revalidatePath("/tiket");
    revalidatePath("/2026/dashboard");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/transactions");

    return {
      success: true,
      booking: {
        id: result.booking.id,
        bookingCode: result.booking.bookingCode,
        memberName: result.member.name,
        phoneNumber: result.member.phone,
        className: schedule.title,
        instructorName: schedule.instructor,
        dayOfWeek,
        shortDate,
        scheduleIso: schedule.date.toISOString(),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        amount: schedule.price,
        paymentMethod: input.paymentMethod,
        status: result.booking.paymentStatus,
        expiresAtIso,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memproses booking.",
    };
  }
}

export async function confirmGuestPayment(
  bookingId: string,
  phoneNumber: string,
) {
  try {
    const { variants } = normalizePhoneVariants(phoneNumber);
    const member = await prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (!member)
      return { success: false, error: "Data pemesan tidak ditemukan." };

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: member.id },
    });
    if (!booking) return { success: false, error: "Pesanan tidak ditemukan." };

    if (
      booking.attendanceStatus === "CANCELLED" ||
      booking.paymentStatus === "REJECTED"
    ) {
      return {
        success: false,
        error: "Pesanan sudah dibatalkan atau melewati batas waktu.",
      };
    }

    const expiresAt = booking.createdAt.getTime() + PAYMENT_DEADLINE_MS;
    if (
      booking.notes === "GUEST_HOLD" &&
      booking.paymentStatus === "PENDING" &&
      Date.now() > expiresAt
    ) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "REJECTED", attendanceStatus: "CANCELLED" },
      });
      revalidatePath("/");
      revalidatePath("/jadwal");
      return {
        success: false,
        error:
          "Batas waktu pembayaran (15 menit) telah habis. Silakan booking ulang.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "PAID", notes: "GUEST_PAID" },
      });

      const pendingTx = await tx.transaction.findFirst({
        where: { userId: member.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });

      if (pendingTx) {
        await tx.transaction.update({
          where: { id: pendingTx.id },
          data: { status: "PAID" },
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/jadwal");
    revalidatePath("/tiket");
    revalidatePath("/2026/dashboard");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/transactions");

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengkonfirmasi pembayaran.",
    };
  }
}

export interface GuestTicketItem {
  id: string;
  bookingCode: string;
  memberName: string;
  phoneNumber: string;
  className: string;
  instructorName: string;
  imageUrl: string;
  dayOfWeek: string;
  shortDate: string;
  startTime: string;
  endTime: string;
  scheduleIso: string;
  amount: number;
  paymentMethod: "QRIS" | "TRANSFER" | "TUNAI";
  paymentStatus: string;
  attendanceStatus: string;
  expiresAtIso: string;
  isGuestHold: boolean;
}

export async function getGuestTicketsByPhone(phoneNumber: string): Promise<{
  success: boolean;
  memberName?: string;
  tickets: GuestTicketItem[];
  error?: string;
}> {
  try {
    const { clean, variants } = normalizePhoneVariants(phoneNumber);
    if (clean.length < 8) {
      return {
        success: false,
        tickets: [],
        error: "Masukkan nomor WhatsApp yang valid.",
      };
    }

    await expireStaleGuestHolds();

    const member = await prisma.user.findFirst({
      where: { phone: { in: variants } },
    });

    if (!member) {
      return { success: true, tickets: [] };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: member.id,
      },
      include: { schedule: true },
      orderBy: { createdAt: "desc" },
    });

    const tickets: GuestTicketItem[] = bookings.map((b) => {
      const { dayOfWeek, shortDate } = getJakartaDayAndDate(b.schedule.date);
      return {
        id: b.id,
        bookingCode: b.bookingCode,
        memberName: member.name,
        phoneNumber: member.phone,
        className: b.schedule.title,
        instructorName: b.schedule.instructor,
        imageUrl: getClassImage(
          b.schedule.title,
          b.schedule.category,
          b.schedule.instructorPhoto,
        ),
        dayOfWeek,
        shortDate,
        startTime: b.schedule.startTime,
        endTime: b.schedule.endTime,
        scheduleIso: b.schedule.date.toISOString(),
        amount: b.amount,
        paymentMethod: DB_TO_METHOD_LABEL[b.paymentMethod] || "TRANSFER",
        paymentStatus: b.paymentStatus,
        attendanceStatus: b.attendanceStatus,
        expiresAtIso: new Date(
          b.createdAt.getTime() + PAYMENT_DEADLINE_MS,
        ).toISOString(),
        isGuestHold: b.notes === "GUEST_HOLD",
      };
    });

    return {
      success: true,
      memberName: member.name,
      tickets,
    };
  } catch (error: any) {
    return { success: false, tickets: [], error: error.message };
  }
}

export async function cancelGuestBooking(
  bookingId: string,
  phoneNumber: string,
) {
  try {
    const { variants } = normalizePhoneVariants(phoneNumber);
    const member = await prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (!member)
      return { success: false, error: "Data pemesan tidak ditemukan." };

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: member.id },
    });
    if (!booking) return { success: false, error: "Tiket tidak ditemukan." };

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { attendanceStatus: "CANCELLED", paymentStatus: "REJECTED" },
      });

      const pendingTx = await tx.transaction.findFirst({
        where: { userId: member.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      if (pendingTx) {
        await tx.transaction.update({
          where: { id: pendingTx.id },
          data: { status: "REJECTED" },
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/jadwal");
    revalidatePath("/tiket");
    revalidatePath("/2026/dashboard");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/transactions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
