import { getPublicSchedule } from "@/app/actions/public";
import ParanamBookingView from "@/components/public/ParanamBookingView";

export const dynamic = "force-dynamic";

export default async function PublicJadwalPage() {
  const res = await getPublicSchedule();
  return (
    <ParanamBookingView
      initialSlots={res.slots || []}
      studioInfo={res.studioInfo}
    />
  );
}
