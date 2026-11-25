import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, CalendarDays, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VerifyPage(props: {
  params: Promise<{ memberCode: string }>;
}) {
  const params = await props.params;
  const code = decodeURIComponent(params.memberCode).trim();

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ bookingCode: code }, { id: code }],
    },
    include: {
      user: true,
      schedule: true,
    },
  });

  if (!booking) {
    return (
      <div className="min-h-[100dvh] bg-[#162620] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 border border-rose-500/30">
          <XCircle className="w-10 h-10 text-rose-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
          E-Ticket Tidak Valid
        </h1>
        <p className="text-[#9DC0A8]/80 text-sm mb-8 max-w-xs font-medium">
          Kode booking ({code}) tidak terdaftar di sistem Paranam Lumina Studio.
        </p>
        <Link
          href="/"
          className="px-8 py-4 bg-[#3B6251] text-white rounded-xl font-bold hover:bg-[#497964] transition-colors shadow-lg"
        >
          Kembali ke Jadwal
        </Link>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === "PAID";
  const isAttended = booking.attendanceStatus === "ATTENDED";
  const dateStr = booking.schedule.date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="min-h-[100dvh] bg-[#162620] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#FAF9F6] rounded-[2rem] shadow-2xl overflow-hidden border border-[#E6E2D8]">
        <div className="bg-[#254336] p-6 text-center text-white">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#9DC0A8] uppercase mb-1">
            Paranam Lumina Studio
          </p>
          <h1 className="text-xl font-extrabold">{booking.schedule.title}</h1>
          <p className="text-xs text-white/80 mt-1 flex items-center justify-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {dateStr} • {booking.schedule.startTime} WIB
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#162620] text-white text-xs font-mono font-bold">
              {booking.bookingCode}
            </span>
            <h2 className="text-2xl font-black text-[#162620] mt-3">
              {booking.user.name}
            </h2>
            <p className="text-xs text-[#5D6E66]">{booking.user.phone}</p>
          </div>

          <div className="bg-[#F6F4EF] rounded-2xl p-4 border border-[#E6E2D8] space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#5D6E66] flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Instruktur
              </span>
              <span className="font-bold text-[#162620]">
                {booking.schedule.instructor}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5D6E66]">Status Pembayaran</span>
              <span
                className={`font-extrabold ${isPaid ? "text-emerald-700" : "text-amber-600"}`}
              >
                {isPaid ? "LUNAS" : booking.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5D6E66]">Status Kehadiran</span>
              <span
                className={`font-extrabold inline-flex items-center gap-1 ${isAttended ? "text-emerald-700" : "text-[#5D6E66]"}`}
              >
                {isAttended ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {isAttended ? "SUDAH HADIR" : "BELUM CHECK-IN"}
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 bg-[#162620] hover:bg-[#3B6251] text-white rounded-xl font-bold text-sm text-center block transition-colors"
          >
            Kembali ke Jadwal Kelas
          </Link>
        </div>
      </div>
    </div>
  );
}
