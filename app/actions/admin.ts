"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== "OWNER" && user.role !== "KASIR")) {
    throw new Error("Forbidden: Admin / Kasir only");
  }
  return user;
}

export async function confirmBookingPayment(bookingId: string) {
  await verifyAdmin();
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return { success: false, error: "Booking tidak ditemukan." };

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: "PAID", notes: "VERIFIED_BY_ADMIN" },
      });

      const pendingTx = await tx.transaction.findFirst({
        where: { userId: booking.userId, status: "PENDING" },
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
    revalidatePath("/tiket");
    revalidatePath("/2026/dashboard");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/transactions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markBookingAttended(bookingId: string) {
  await verifyAdmin();
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { attendanceStatus: "ATTENDED", paymentStatus: "PAID" },
    });

    revalidatePath("/tiket");
    revalidatePath("/2026/dashboard");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/scanner");
    revalidatePath("/2026/transactions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelAdminBooking(bookingId: string) {
  await verifyAdmin();
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { attendanceStatus: "CANCELLED", paymentStatus: "REJECTED" },
    });

    revalidatePath("/");
    revalidatePath("/tiket");
    revalidatePath("/2026/dashboard");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/transactions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createClassSchedule(data: {
  title: string;
  category: string;
  instructor: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  price: number;
  maxCapacity: number;
  room?: string;
}) {
  await verifyAdmin();
  try {
    // Parse YYYY-MM-DD as midnight WIB (17:00 UTC day before) matching existing DB format
    const [y, m, d] = data.dateStr.split("-").map(Number);
    const wibMidnightUtc = new Date(
      Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 60 * 60 * 1000,
    );

    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    const durationMinutes = Math.max(30, eh * 60 + em - (sh * 60 + sm));

    const created = await prisma.classSchedule.create({
      data: {
        title: data.title.trim(),
        category: data.category.trim() || "All Levels",
        instructor: data.instructor.trim(),
        date: wibMidnightUtc,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes,
        price: Number(data.price) || 90000,
        maxCapacity: Number(data.maxCapacity) || 10,
        room: data.room?.trim() || "Studio Utama Paranam",
        status: "UPCOMING",
      },
    });

    revalidatePath("/");
    revalidatePath("/jadwal");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/dashboard");
    return { success: true, id: created.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateClassSchedule(
  id: string,
  data: {
    title: string;
    category: string;
    instructor: string;
    dateStr: string;
    startTime: string;
    endTime: string;
    price: number;
    maxCapacity: number;
    room?: string;
    instructorPhoto?: string;
  },
) {
  await verifyAdmin();
  try {
    const [y, m, d] = data.dateStr.split("-").map(Number);
    const wibMidnightUtc = new Date(
      Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 60 * 60 * 1000,
    );
    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    const durationMinutes = Math.max(30, eh * 60 + em - (sh * 60 + sm));

    await prisma.classSchedule.update({
      where: { id },
      data: {
        title: data.title.trim(),
        category: data.category.trim() || "All Levels",
        instructor: data.instructor.trim(),
        date: wibMidnightUtc,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes,
        price: Number(data.price) || 90000,
        maxCapacity: Number(data.maxCapacity) || 10,
        room: data.room?.trim() || "Studio Utama Paranam",
        ...(data.instructorPhoto
          ? { instructorPhoto: data.instructorPhoto }
          : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/jadwal");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteClassSchedule(id: string) {
  await verifyAdmin();
  try {
    const activeCount = await prisma.booking.count({
      where: {
        scheduleId: id,
        attendanceStatus: { not: "CANCELLED" },
      },
    });
    if (activeCount > 0) {
      return {
        success: false,
        error: `Tidak bisa hapus kelas karena masih ada ${activeCount} booking aktif.`,
      };
    }

    await prisma.booking.deleteMany({ where: { scheduleId: id } });
    await prisma.classSchedule.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/jadwal");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processQRCheckIn(codeInput: string) {
  await verifyAdmin();
  try {
    const clean = codeInput.trim();
    if (!clean) return { success: false, error: "Kode tidak boleh kosong." };

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ bookingCode: clean }, { id: clean }],
      },
      include: {
        user: true,
        schedule: true,
      },
    });

    if (!booking) {
      return { success: false, error: `E-Ticket "${clean}" tidak ditemukan.` };
    }

    if (
      booking.attendanceStatus === "CANCELLED" ||
      booking.paymentStatus === "REJECTED"
    ) {
      return {
        success: false,
        error: `Booking ${booking.bookingCode} sudah dibatalkan.`,
      };
    }

    const alreadyAttended = booking.attendanceStatus === "ATTENDED";

    if (!alreadyAttended) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          attendanceStatus: "ATTENDED",
          paymentStatus: "PAID",
        },
      });
    }

    revalidatePath("/tiket");
    revalidatePath("/2026/scanner");
    revalidatePath("/2026/dashboard");
    revalidatePath("/2026/personal-trainer");

    return {
      success: true,
      data: {
        name: booking.user.name,
        phone: booking.user.phone,
        bookingCode: booking.bookingCode,
        className: booking.schedule.title,
        instructor: booking.schedule.instructor,
        startTime: booking.schedule.startTime,
        time: new Date().toISOString(),
        status: alreadyAttended ? ("already" as const) : ("success" as const),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memproses QR." };
  }
}

export async function createStudioExpense(data: {
  category: string;
  description: string;
  amount: number;
  paymentMethod: "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL";
}) {
  const admin = await verifyAdmin();
  try {
    const cleanDesc = data.description.trim();
    const cleanCat = data.category.trim() || "Operasional";
    const numAmount = Number(data.amount);

    if (!cleanDesc)
      return { success: false, error: "Keterangan pengeluaran wajib diisi." };
    if (!numAmount || numAmount <= 0)
      return { success: false, error: "Nominal harus lebih dari 0." };

    const code = `EXP-${Date.now().toString().slice(-6)}`;
    const created = await prisma.transaction.create({
      data: {
        invoiceNumber: code,
        userId: admin.id,
        type: `EXPENSE:${cleanCat}:${cleanDesc}`,
        amount: numAmount,
        paymentMethod: data.paymentMethod,
        status: "PAID",
      },
    });

    revalidatePath("/2026/transactions");
    revalidatePath("/2026/dashboard");
    return {
      success: true,
      expense: {
        id: created.id,
        code: created.invoiceNumber,
        category: cleanCat,
        description: cleanDesc,
        amount: created.amount,
        method: created.paymentMethod,
        date: created.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menyimpan pengeluaran.",
    };
  }
}

export async function deleteStudioExpense(id: string) {
  await verifyAdmin();
  try {
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/2026/transactions");
    revalidatePath("/2026/dashboard");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghapus pengeluaran.",
    };
  }
}

// Duplikat semua jadwal kelas aktif ke +7 hari berikutnya (anti-duplikat)
export async function cloneNextWeekSchedules() {
  await verifyAdmin();
  try {
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

    const existing = await prisma.classSchedule.findMany({
      where: { date: { gte: todayWibMidnight }, status: "UPCOMING" },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    if (existing.length === 0) {
      return {
        success: false,
        error: "Belum ada jadwal aktif untuk diduplikat.",
      };
    }

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const createdItems: any[] = [];

    for (const s of existing) {
      const nextDate = new Date(s.date.getTime() + sevenDaysMs);
      // Cek apakah kelas yang sama pada tanggal +7 hari & jam yang sama sudah ada
      const dup = await prisma.classSchedule.findFirst({
        where: {
          title: s.title,
          instructor: s.instructor,
          startTime: s.startTime,
          date: nextDate,
        },
      });
      if (!dup) {
        const created = await prisma.classSchedule.create({
          data: {
            title: s.title,
            category: s.category,
            instructor: s.instructor,
            instructorPhoto: s.instructorPhoto,
            description: s.description,
            date: nextDate,
            startTime: s.startTime,
            endTime: s.endTime,
            durationMinutes: s.durationMinutes,
            price: s.price,
            maxCapacity: s.maxCapacity,
            room: s.room,
            status: "UPCOMING",
          },
        });
        createdItems.push({
          id: created.id,
          title: created.title,
          category: created.category,
          instructor: created.instructor,
          dateIso: created.date.toISOString(),
          startTime: created.startTime,
          endTime: created.endTime,
          price: created.price,
          maxCapacity: created.maxCapacity,
          bookedCount: 0,
          room: created.room,
          ...(created.instructorPhoto
            ? { instructorPhoto: created.instructorPhoto }
            : {}),
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/jadwal");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/dashboard");

    if (createdItems.length === 0) {
      return {
        success: false,
        error: "Semua jadwal minggu depan sudah tersedia.",
      };
    }
    return { success: true, count: createdItems.length, createdItems };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menduplikat jadwal.",
    };
  }
}

// Transaksi Kasir Langsung (Tunai / Non-Cashless / Walk-in) untuk Kelas atau Paket
export async function createCashierBooking(data: {
  customerName: string;
  customerPhone: string;
  scheduleId: string;
  packageName?: string;
  amount: number;
  paymentMethod: "CASH_STUDIO" | "TRANSFER_MANUAL" | "QRIS_MANUAL";
}) {
  await verifyAdmin();
  try {
    const cleanName = data.customerName.trim();
    const cleanPhone = data.customerPhone.replace(/[^0-9]/g, "");
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Nama tamu wajib diisi." };
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, error: "Nomor WhatsApp minimal 8 digit." };
    }
    if (!data.scheduleId) {
      return { success: false, error: "Pilih jadwal kelas terlebih dahulu." };
    }

    const schedule = await prisma.classSchedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        bookings: {
          where: {
            attendanceStatus: { not: "CANCELLED" },
            paymentStatus: { not: "REJECTED" },
          },
          select: { id: true },
        },
      },
    });

    if (!schedule) return { success: false, error: "Kelas tidak ditemukan." };
    if (schedule.bookings.length >= schedule.maxCapacity) {
      return { success: false, error: "Kuota matras kelas ini sudah penuh." };
    }

    let user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: cleanName,
          phone: cleanPhone,
          pin: "123456",
          role: "MEMBER",
          ...(data.packageName ? { activePackageName: data.packageName } : {}),
        },
      });
    } else if (data.packageName) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activePackageName: data.packageName },
      });
    }

    const bookingCode = `PL-${Date.now().toString().slice(-6)}`;
    const finalAmount =
      Number(data.amount) > 0 ? Number(data.amount) : schedule.price;

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        userId: user.id,
        scheduleId: schedule.id,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PAID",
        attendanceStatus: "PENDING",
        amount: finalAmount,
        notes: data.packageName
          ? `WALKIN_KASIR:${data.packageName}`
          : "WALKIN_KASIR",
      },
    });

    revalidatePath("/");
    revalidatePath("/tiket");
    revalidatePath("/2026/transactions");
    revalidatePath("/2026/personal-trainer");
    revalidatePath("/2026/dashboard");

    return {
      success: true,
      transaction: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        memberName: user.name,
        memberPhone: user.phone,
        type: data.packageName
          ? `${schedule.title} (${schedule.startTime}) · ${data.packageName}`
          : `${schedule.title} (${schedule.startTime})`,
        amount: booking.amount,
        method: booking.paymentMethod,
        status: "PAID" as const,
        date: booking.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mencatat transaksi kasir.",
    };
  }
}
