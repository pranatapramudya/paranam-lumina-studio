import { getGuestTicketsByPhone } from "@/app/actions/public";
import TiketClient from "./TiketClient";

export const dynamic = "force-dynamic";

export default async function PublicTiketPage({
  searchParams,
}: {
  searchParams: Promise<{ wa?: string }>;
}) {
  const { wa } = await searchParams;
  const initialPhone = (wa || "").trim();

  let initialResult = null;
  if (initialPhone) {
    initialResult = await getGuestTicketsByPhone(initialPhone);
  }

  return (
    <TiketClient initialPhone={initialPhone} initialResult={initialResult} />
  );
}
