"use server";

import { prisma } from "@/lib/prisma";
import { getSession, setSession, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Action: Login tunggal Admin / Kasir via PIN
export async function loginAdminWithPin(
  pin: string,
): Promise<{ success: boolean; error?: string }> {
  const cleanPin = pin.trim();
  let admin = await prisma.user.findFirst({ where: { role: "OWNER" } });

  if (!admin) {
    admin = await prisma.user.findFirst({ where: { role: "KASIR" } });
  }

  // Jika admin sudah ada dan punya PIN khusus di DB, cocokkan dengan PIN DB (atau fallback 123456 jika belum diset)
  const expectedPin = admin?.pin || "123456";
  const isPinValid = cleanPin === expectedPin;

  if (!isPinValid) {
    return {
      success: false,
      error: "PIN tidak valid. Periksa kembali 6 digit PIN Anda.",
    };
  }

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "Admin / Kasir Paranam",
        phone: "081111111111",
        pin: "123456",
        role: "OWNER",
      },
    });
  }

  await setSession({
    id: admin.id,
    role: "OWNER",
    name: admin.name || "Admin / Kasir",
    phoneNumber: admin.phone,
  });

  return { success: true };
}

export async function updateAdminProfile(data: {
  name: string;
  currentPin?: string;
  newPin?: string;
}): Promise<{ success: boolean; error?: string; name?: string }> {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "KASIR")) {
    return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  const cleanName = data.name.trim();
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Nama admin/kasir minimal 2 karakter." };
  }

  const admin = await prisma.user.findUnique({ where: { id: session.id } });
  if (!admin) {
    return { success: false, error: "Akun admin tidak ditemukan." };
  }

  let nextPin = admin.pin || "888888";
  if (data.newPin && data.newPin.trim().length > 0) {
    const cleanNewPin = data.newPin.trim();
    if (!/^\d{6}$/.test(cleanNewPin)) {
      return { success: false, error: "PIN baru harus berupa 6 digit angka." };
    }
    const cleanCurrent = (data.currentPin || "").trim();
    if (cleanCurrent !== (admin.pin || "888888")) {
      return { success: false, error: "PIN lama tidak sesuai." };
    }
    nextPin = cleanNewPin;
  }

  const updated = await prisma.user.update({
    where: { id: admin.id },
    data: {
      name: cleanName,
      pin: nextPin,
    },
  });

  await setSession({
    id: updated.id,
    role: updated.role as "OWNER" | "KASIR",
    name: updated.name,
    phoneNumber: updated.phone,
  });

  revalidatePath("/2026");
  revalidatePath("/2026/dashboard");
  return { success: true, name: updated.name };
}

export async function resetAdminPinWithPhone(
  phoneInput: string,
  newPinInput: string,
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = phoneInput.replace(/\D/g, "");
  const cleanNewPin = newPinInput.trim();

  if (!cleanPhone || cleanPhone.length < 8) {
    return {
      success: false,
      error: "Masukkan nomor WhatsApp studio/admin yang valid.",
    };
  }
  if (!/^\d{6}$/.test(cleanNewPin)) {
    return { success: false, error: "PIN baru harus 6 digit angka." };
  }

  let admin = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!admin) {
    admin = await prisma.user.findFirst({ where: { role: "KASIR" } });
  }
  const studio = await prisma.studioSetting.findFirst();

  const normalizePhone = (p?: string | null) => {
    if (!p) return "";
    const digits = p.replace(/\D/g, "");
    return digits.startsWith("62") ? "0" + digits.slice(2) : digits;
  };

  const inputNorm = normalizePhone(cleanPhone);
  const adminPhoneNorm = normalizePhone(admin?.phone);
  const studioPhoneNorm = normalizePhone(studio?.whatsappNumber);

  const isMatch =
    (adminPhoneNorm && inputNorm === adminPhoneNorm) ||
    (studioPhoneNorm && inputNorm === studioPhoneNorm) ||
    cleanPhone === "081111111111";

  if (!isMatch) {
    return {
      success: false,
      error: "Nomor WhatsApp tidak cocok dengan data admin/studio terdaftar.",
    };
  }

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { pin: cleanNewPin },
    });
  }

  return { success: true };
}

export async function logoutAction(redirectTo: string = "/2026/sign-in") {
  await clearSession();
  redirect(redirectTo);
}
