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
      <footer className="hidden md:block border-t border-[#E6E2D8] py-3 text-center bg-[#F1EEE7]">
        <p className="text-[10px] text-[#9CA8A0]">
          Support by{" "}
          <a
            href="https://pranajayatech.online"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#4D7762] transition-colors"
          >
            PranajayaTech
          </a>
        </p>
      </footer>
    </div>
  );
}
