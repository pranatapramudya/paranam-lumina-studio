import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const sessionCookie = req.cookies.get("paranam_session")?.value;

  // Set x-pathname for server layout detection
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Proteksi rute admin /2026
  if (pathname.startsWith("/2026") && !pathname.startsWith("/2026/sign-in")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/2026/sign-in", req.url));
    }
  }

  // Proteksi rute member /member
  if (pathname.startsWith("/member")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
