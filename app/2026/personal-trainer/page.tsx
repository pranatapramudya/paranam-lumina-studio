import { prisma } from "@/lib/prisma";
import ClassesClient from "./ClassesClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JadwalDanBookingPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/2026/sign-in");

  const searchParams = await props.searchParams;
  const fromParam = searchParams.from;
  const toParam = searchParams.to;

  const bookingWhere: any = {};
  if (fromParam || toParam) {
    bookingWhere.createdAt = {};
    if (fromParam) bookingWhere.createdAt.gte = new Date(fromParam);
    if (toParam) {
      const end = new Date(toParam);
      end.setHours(23, 59, 59, 999);
      bookingWhere.createdAt.lte = end;
    }
  }

  const [bookingsRaw, schedulesRaw, packagesRaw] = await Promise.all([
    prisma.booking.findMany({
      where: bookingWhere,
      include: {
        user: { select: { name: true, phone: true } },
        schedule: {
          select: {
            title: true,
            instructor: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.classSchedule.findMany({
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
    prisma.package.findMany({
      orderBy: { price: "asc" },
    }),
  ]);

  const bookings = bookingsRaw.map((b) => ({
    id: b.id,
    bookingCode: b.bookingCode,
    customerName: b.user.name,
    customerPhone: b.user.phone,
    className: b.schedule.title,
    instructor: b.schedule.instructor,
    scheduleDateIso: b.schedule.date.toISOString(),
    startTime: b.schedule.startTime,
    endTime: b.schedule.endTime,
    amount: b.amount,
    paymentMethod: b.paymentMethod,
    paymentStatus: b.paymentStatus,
    attendanceStatus: b.attendanceStatus,
    createdAtIso: b.createdAt.toISOString(),
  }));

  const schedules = schedulesRaw.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    instructor: s.instructor,
    dateIso: s.date.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    price: s.price,
    maxCapacity: s.maxCapacity,
    bookedCount: s.bookings.length,
    room: s.room,
  }));

  const packages = packagesRaw.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: p.price,
    totalSessions: p.totalSessions,
    validityDays: p.validityDays,
    isActive: p.isActive,
  }));

  return (
    <ClassesClient
      initialBookings={bookings}
      initialSchedules={schedules}
      initialPackages={packages}
    />
  );
}
