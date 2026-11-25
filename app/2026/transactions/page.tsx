import { prisma } from "@/lib/prisma";
import TransactionsClient from "./TransactionsClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TransactionsPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/2026/sign-in");

  const searchParams = await props.searchParams;
  const fromParam = searchParams?.from;
  const toParam = searchParams?.to;

  const whereClause: any = {};
  if (fromParam || toParam) {
    whereClause.createdAt = {};
    if (fromParam)
      whereClause.createdAt.gte = new Date(`${fromParam}T00:00:00+07:00`);
    if (toParam)
      whereClause.createdAt.lte = new Date(`${toParam}T23:59:59.999+07:00`);
  }

  const [bookings, expenseTxs, schedules, packages] = await Promise.all([
    prisma.booking.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true } },
        schedule: {
          select: { title: true, instructor: true, startTime: true },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        ...(Object.keys(whereClause).length > 0 ? whereClause : {}),
        type: { startsWith: "EXPENSE:" },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.classSchedule.findMany({
      where: { status: "UPCOMING" },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        bookings: {
          where: {
            attendanceStatus: { not: "CANCELLED" },
            paymentStatus: { not: "REJECTED" },
          },
          select: { id: true },
        },
      },
    }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
  ]);

  const formattedTransactions = bookings.map((b) => ({
    id: b.id,
    bookingCode: b.bookingCode,
    memberName: b.user.name,
    memberPhone: b.user.phone,
    type: `${b.schedule.title} (${b.schedule.startTime})`,
    amount: b.amount,
    date: b.createdAt.toISOString(),
    status: b.paymentStatus,
    method: b.paymentMethod,
  }));

  const formattedExpenses = expenseTxs.map((t) => {
    const parts = t.type.replace("EXPENSE:", "").split(":");
    const category = parts[0]?.trim() || "Operasional";
    const description = parts.slice(1).join(":").trim() || t.type;
    return {
      id: t.id,
      code: t.invoiceNumber,
      category,
      description,
      amount: t.amount,
      method: t.paymentMethod,
      date: t.createdAt.toISOString(),
    };
  });

  const activeSchedules = schedules.map((s) => ({
    id: s.id,
    title: s.title,
    instructor: s.instructor,
    dateLabel: s.date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Jakarta",
    }),
    startTime: s.startTime,
    price: s.price,
    remaining: Math.max(0, s.maxCapacity - s.bookings.length),
  }));

  const activePackages = packages.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    totalSessions: p.totalSessions,
  }));

  return (
    <TransactionsClient
      initialTransactions={formattedTransactions}
      initialExpenses={formattedExpenses}
      activeSchedules={activeSchedules}
      activePackages={activePackages}
    />
  );
}
