import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#4D7762",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://paranam-lumina-studio.vercel.app"),
  title: {
    default: "Paranam Lumina Studio — Booking Yoga, Pilates & Sound Healing",
    template: "%s | Paranam Lumina Studio",
  },
  description:
    "Sanctuary Yoga, Pilates & Sound Healing Studio Depok. Cek jadwal kelas, sisa kuota matras real-time, dan booking langsung tanpa daftar.",
  keywords: [
    "Yoga Depok",
    "Pilates Depok",
    "Sound Healing Depok",
    "Paranam Lumina Studio",
    "Booking Kelas Yoga",
  ],
  authors: [
    { name: "PJTech (PranajayaTech)", url: "https://pranajayatech.online" },
  ],
  openGraph: {
    title: "Paranam Lumina Studio — Booking Yoga, Pilates & Sound Healing",
    description:
      "Cek ketersediaan matras tiap sesi, pilih hari & instruktur favoritmu, dan dapatkan E-Ticket QR instan.",
    type: "website",
    locale: "id_ID",
    siteName: "Paranam Lumina Studio",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Paranam Lumina",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
