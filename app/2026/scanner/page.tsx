import { prisma } from "@/lib/prisma";
import ScannerClient from "./ScannerClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ScannerPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/2026/sign-in");

  const searchParams = await props.searchParams;
  const fromParam = searchParams?.from;
  const toParam = searchParams?.to;

  const whereClause: any = {
    attendanceStatus: "ATTENDED",
  };
  if (fromParam || toParam) {
    whereClause.updatedAt = {};
    if (fromParam) whereClause.updatedAt.gte = new Date(fromParam);
    if (toParam) {
      const end = new Date(toParam);
      end.setHours(23, 59, 59, 999);
      whereClause.updatedAt.lte = end;
    }
  }

  const attended = await prisma.booking.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, phone: true } },
      schedule: { select: { title: true, instructor: true, startTime: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedHistory = attended.map((b) => ({
    name: b.user.name,
    phone: b.user.phone,
    bookingCode: b.bookingCode,
    className: b.schedule.title,
    instructor: b.schedule.instructor,
    startTime: b.schedule.startTime,
    time: b.updatedAt.toISOString(),
    status: "success" as const,
  }));

  return <ScannerClient initialHistory={formattedHistory} />;
}
