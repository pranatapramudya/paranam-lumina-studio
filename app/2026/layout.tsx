import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { RoleToast } from "@/components/admin/RoleToast";
import { Suspense } from "react";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  if (pathname.includes("/2026/sign-in")) {
    return <>{children}</>;
  }

  const session = await getSession();

  if (!session || (session.role !== "OWNER" && session.role !== "KASIR")) {
    redirect("/2026/sign-in");
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F6F4EF] font-sans">
      <AdminNavbar adminName={session.name || "Admin / Kasir"} />
      <main className="flex-1 w-full pb-24 md:pb-8">
        {children}
        <Suspense fallback={null}>
          <RoleToast />
        </Suspense>
      </main>
    </div>
  );
}
