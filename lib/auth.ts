import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  role: "OWNER" | "KASIR" | "MEMBER";
  name: string;
  phoneNumber?: string;
}

const COOKIE_NAME = "paranam_session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(user)).toString("base64");
  cookieStore.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function auth(): Promise<{
  userId: string | null;
  role?: string | null;
}> {
  const session = await getSession();
  return {
    userId: session?.id || null,
    role: session?.role || null,
  };
}

export async function currentUser(): Promise<any> {
  const session = await getSession();
  if (!session) return null;
  return {
    id: session.id,
    firstName: session.name?.split(" ")[0] || "Admin",
    lastName: session.name?.split(" ").slice(1).join(" ") || "",
    emailAddresses: [{ emailAddress: "admin@paranam.com" }],
    phoneNumbers: session.phoneNumber
      ? [{ phoneNumber: session.phoneNumber }]
      : [],
  };
}
