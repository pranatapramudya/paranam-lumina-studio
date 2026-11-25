import { prisma } from "@/lib/prisma";
import DashboardClient from "./_components/DashboardClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboard(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/2026/sign-in");

  const resolvedSearchParams = await props.searchParams;
  const fromParam = resolvedSearchParams?.from;
  const toParam = resolvedSearchParams?.to;

  const jakartaTimeStr = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });
  const localNow = new Date(jakartaTimeStr);

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (fromParam) startDate = new Date(`${fromParam}T00:00:00+07:00`);
  if (toParam) endDate = new Date(`${toParam}T23:59:59.999+07:00`);

  const bookingWhere: any = {
    attendanceStatus: { not: "CANCELLED" },
    paymentStatus: { not: "REJECTED" },
  };
  if (startDate || endDate) {
    bookingWhere.createdAt = {};
    if (startDate) bookingWhere.createdAt.gte = startDate;
    if (endDate) bookingWhere.createdAt.lte = endDate;
  }

  const [bookings, totalSchedules, expenseTxs] = await Promise.all([
    prisma.booking.findMany({
      where: bookingWhere,
      include: {
        user: { select: { name: true, phone: true } },
        schedule: {
          select: { title: true, instructor: true, startTime: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.classSchedule.count({ where: { status: "UPCOMING" } }),
    prisma.transaction.findMany({
      where: {
        type: { startsWith: "EXPENSE:" },
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      select: { amount: true },
    }),
  ]);

  const paidBookings = bookings.filter((b) => b.paymentStatus === "PAID");
  const pendingBookings = bookings.filter((b) => b.paymentStatus === "PENDING");
  const attendedCount = bookings.filter(
    (b) => b.attendanceStatus === "ATTENDED",
  ).length;
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = expenseTxs.reduce((sum, e) => sum + e.amount, 0);

  // Revenue chart grouped by hour if <=2 days, else by date
  const chartMap = new Map<string, number>();
  for (const b of paidBookings) {
    const label = b.createdAt.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Jakarta",
    });
    chartMap.set(label, (chartMap.get(label) || 0) + b.amount);
  }
  const chartData =
    chartMap.size > 0
      ? Array.from(chartMap.entries())
          .reverse()
          .map(([name, amount]) => ({ name, amount }))
      : [
          {
            name: localNow.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            }),
            amount: 0,
          },
        ];

  const recentBookings = bookings.slice(0, 6).map((b) => ({
    id: b.id,
    bookingCode: b.bookingCode,
    customerName: b.user.name,
    className: b.schedule.title,
    amount: b.amount,
    paymentStatus: b.paymentStatus,
    attendanceStatus: b.attendanceStatus,
    timestamp: b.createdAt.toISOString(),
  }));

  return (
    <DashboardClient
      totalBookings={bookings.length}
      pendingPayments={pendingBookings.length}
      totalSchedules={totalSchedules}
      attendedCount={attendedCount}
      revenue={totalRevenue}
      expenses={totalExpenses}
      chartData={chartData}
      recentBookings={recentBookings}
    />
  );
}
