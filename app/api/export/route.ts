import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

function getDateRange(period: string | null) {
  const now = new Date();
  const jakartaOffset = 7 * 60 * 60 * 1000;

  if (period === "daily") {
    // Today in WIB
    const todayWib = new Date(now.getTime() + jakartaOffset);
    const startWib = new Date(
      Date.UTC(
        todayWib.getUTCFullYear(),
        todayWib.getUTCMonth(),
        todayWib.getUTCDate(),
        0,
        0,
        0,
      ) - jakartaOffset,
    );
    const endWib = new Date(startWib.getTime() + 24 * 60 * 60 * 1000 - 1);
    return {
      from: startWib,
      to: endWib,
      label: `Harian_${todayWib.toISOString().slice(0, 10)}`,
    };
  }

  if (period === "weekly") {
    const todayWib = new Date(now.getTime() + jakartaOffset);
    const day = todayWib.getUTCDay(); // 0=Sun
    const diffToMon = (day + 6) % 7;
    const monWib = new Date(
      Date.UTC(
        todayWib.getUTCFullYear(),
        todayWib.getUTCMonth(),
        todayWib.getUTCDate() - diffToMon,
        0,
        0,
        0,
      ) - jakartaOffset,
    );
    const sunWib = new Date(monWib.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    return {
      from: monWib,
      to: sunWib,
      label: `Mingguan_${monWib.toISOString().slice(0, 10)}_sd_${sunWib.toISOString().slice(0, 10)}`,
    };
  }

  if (period === "monthly") {
    const todayWib = new Date(now.getTime() + jakartaOffset);
    const startOfMonth = new Date(
      Date.UTC(todayWib.getUTCFullYear(), todayWib.getUTCMonth(), 1, 0, 0, 0) -
        jakartaOffset,
    );
    const endOfMonth = new Date(
      Date.UTC(
        todayWib.getUTCFullYear(),
        todayWib.getUTCMonth() + 1,
        1,
        0,
        0,
        0,
      ) -
        jakartaOffset -
        1,
    );
    const monthName = todayWib.toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
    return {
      from: startOfMonth,
      to: endOfMonth,
      label: `Bulanan_${monthName.replace(" ", "_")}`,
    };
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const rangeInfo = getDateRange(period);

    const where: any = {};
    if (rangeInfo) {
      where.createdAt = { gte: rangeInfo.from, lte: rangeInfo.to };
    } else if (fromParam || toParam) {
      where.createdAt = {};
      if (fromParam)
        where.createdAt.gte = new Date(`${fromParam}T00:00:00+07:00`);
      if (toParam)
        where.createdAt.lte = new Date(`${toParam}T23:59:59.999+07:00`);
    }

    const [bookings, schedules, expenseTxs] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
          schedule: {
            select: {
              title: true,
              instructor: true,
              startTime: true,
              endTime: true,
              date: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.classSchedule.findMany({
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: {
          _count: {
            select: {
              bookings: { where: { attendanceStatus: { not: "CANCELLED" } } },
            },
          },
        },
      }),
      prisma.transaction.findMany({
        where: {
          ...(where.createdAt ? { createdAt: where.createdAt } : {}),
          type: { startsWith: "EXPENSE:" },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const wb = xlsx.utils.book_new();

    // ── Sheet 1: RINGKASAN ──────────────────────────────────────────────────────
    const paidBookings = bookings.filter((b) => b.paymentStatus === "PAID");
    const pendingBookings = bookings.filter(
      (b) => b.paymentStatus === "PENDING",
    );
    const cancelledBookings = bookings.filter(
      (b) =>
        b.attendanceStatus === "CANCELLED" || b.paymentStatus === "REJECTED",
    );
    const attendedBookings = bookings.filter(
      (b) => b.attendanceStatus === "ATTENDED",
    );
    const totalRevenue = paidBookings.reduce((s, b) => s + b.amount, 0);
    const totalExpense = expenseTxs.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenue - totalExpense;
    const attendRate =
      bookings.length > 0
        ? Math.round((attendedBookings.length / bookings.length) * 100)
        : 0;

    const periodLabel =
      period === "daily"
        ? "Harian"
        : period === "weekly"
          ? "Mingguan"
          : period === "monthly"
            ? "Bulanan"
            : "Custom";

    const summaryData = [
      ["LAPORAN KEUANGAN PARANAM LUMINA STUDIO", ""],
      [`Periode: ${periodLabel}`, ""],
      [
        `Dicetak: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`,
        "",
      ],
      ["", ""],
      ["METRIK", "NILAI"],
      ["Total Booking Masuk", bookings.length],
      ["Booking Lunas (PAID)", paidBookings.length],
      ["Booking Menunggu Bayar", pendingBookings.length],
      ["Booking Dibatalkan", cancelledBookings.length],
      ["Sudah Check-in Hadir", attendedBookings.length],
      ["Total Pemasukan Lunas (Rp)", totalRevenue],
      ["Total Pengeluaran Kasir (Rp)", totalExpense],
      ["Kas Bersih / Laba (Rp)", netProfit],
      ["Persentase Kehadiran", `${attendRate}%`],
    ];

    const wsSummary = xlsx.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 32 }, { wch: 20 }];
    wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    xlsx.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    // ── Sheet 2: DETAIL BOOKING ─────────────────────────────────────────────────
    const METHOD_LABEL: Record<string, string> = {
      QRIS_MANUAL: "QRIS",
      TRANSFER_MANUAL: "Transfer BCA",
      CASH_STUDIO: "Tunai Studio",
      PACKAGE_CREDIT: "Credit Paket",
    };

    const bookingRows = [
      [
        "No",
        "Kode Booking",
        "Nama Pemesan",
        "No WhatsApp",
        "Nama Kelas",
        "Instruktur",
        "Tanggal Kelas",
        "Jam Mulai",
        "Jam Selesai",
        "Metode Bayar",
        "Status Bayar",
        "Status Hadir",
        "Nominal (Rp)",
      ],
      ...bookings.map((b, i) => {
        const classDate = new Date(b.schedule.date).toLocaleDateString(
          "id-ID",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Jakarta",
          },
        );
        const statusBayar =
          b.paymentStatus === "PAID"
            ? "LUNAS"
            : b.paymentStatus === "REJECTED"
              ? "BATAL"
              : "PENDING";
        const statusHadir =
          b.attendanceStatus === "ATTENDED"
            ? "HADIR"
            : b.attendanceStatus === "CANCELLED"
              ? "BATAL"
              : "BELUM SCAN";
        return [
          i + 1,
          b.bookingCode,
          b.user.name,
          b.user.phone,
          b.schedule.title,
          b.schedule.instructor,
          classDate,
          `${b.schedule.startTime} WIB`,
          `${b.schedule.endTime} WIB`,
          METHOD_LABEL[b.paymentMethod] || b.paymentMethod,
          statusBayar,
          statusHadir,
          b.amount,
        ];
      }),
    ];

    if (paidBookings.length > 0) {
      bookingRows.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "TOTAL LUNAS (Rp)",
        totalRevenue,
      ]);
    }

    const wsBookings = xlsx.utils.aoa_to_sheet(bookingRows);
    wsBookings["!cols"] = [
      { wch: 5 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
      { wch: 26 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
    ];
    xlsx.utils.book_append_sheet(wb, wsBookings, "Detail Booking");

    // ── Sheet 3: JADWAL KELAS ───────────────────────────────────────────────────
    const scheduleRows = [
      [
        "No",
        "Nama Kelas",
        "Kategori",
        "Instruktur",
        "Tanggal",
        "Jam",
        "Kapasitas",
        "Terisi",
        "Sisa",
        "Harga (Rp)",
      ],
      ...schedules.map((s, i) => {
        const tgl = new Date(s.date).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        });
        const terisi = s._count.bookings;
        const sisa = s.maxCapacity - terisi;
        return [
          i + 1,
          s.title,
          s.category,
          s.instructor,
          tgl,
          `${s.startTime} – ${s.endTime} WIB`,
          s.maxCapacity,
          terisi,
          sisa,
          s.price,
        ];
      }),
    ];
    const wsSchedules = xlsx.utils.aoa_to_sheet(scheduleRows);
    wsSchedules["!cols"] = [
      { wch: 5 },
      { wch: 28 },
      { wch: 20 },
      { wch: 16 },
      { wch: 28 },
      { wch: 22 },
      { wch: 10 },
      { wch: 8 },
      { wch: 8 },
      { wch: 14 },
    ];
    xlsx.utils.book_append_sheet(wb, wsSchedules, "Jadwal Kelas");

    // ── Sheet 4: PENGELUARAN STUDIO ─────────────────────────────────────────────
    const expenseRows: any[][] = [
      [
        "No",
        "Kode",
        "Kategori",
        "Keterangan",
        "Metode",
        "Waktu (WIB)",
        "Nominal (Rp)",
      ],
      ...expenseTxs.map((e, i) => {
        const parts = e.type.replace("EXPENSE:", "").split(":");
        const cat = parts[0]?.trim() || "Operasional";
        const desc = parts.slice(1).join(":").trim() || e.type;
        return [
          i + 1,
          e.invoiceNumber,
          cat,
          desc,
          METHOD_LABEL[e.paymentMethod] || e.paymentMethod,
          e.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
          e.amount,
        ];
      }),
    ];
    if (expenseTxs.length > 0) {
      expenseRows.push([
        "",
        "",
        "",
        "",
        "",
        "TOTAL PENGELUARAN (Rp)",
        totalExpense,
      ]);
    }
    const wsExpenses = xlsx.utils.aoa_to_sheet(expenseRows);
    wsExpenses["!cols"] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 22 },
      { wch: 36 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 },
    ];
    xlsx.utils.book_append_sheet(wb, wsExpenses, "Pengeluaran Studio");

    const fileLabel = rangeInfo?.label || "Custom";
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Laporan_Paranam_${fileLabel}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
