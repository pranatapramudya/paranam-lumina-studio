"use client";

import { PublicPackageItem, StudioInfo } from "@/app/actions/public";

interface PackagesSectionProps {
  packages: PublicPackageItem[];
  studioInfo?: StudioInfo | null;
}

export function PackagesSection({
  packages,
  studioInfo,
}: PackagesSectionProps) {
  if (packages.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-[#E6E2D8]">
      <div className="mb-6">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4D7762] bg-[#E9EFEA] px-3 py-1 rounded-full">
          Paket & Tarif Studio
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#162620] mt-2">
          Pilihan Paket Sesi & Keanggotaan
        </h2>
        <p className="text-xs sm:text-sm text-[#5D6E66] mt-1">
          Lebih hemat untuk latihan rutin. Daftar langsung di studio atau
          konsultasi via WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {packages.map((pkg) => {
          const waNum = (studioInfo?.whatsappNumber || "6281234567890").replace(
            /[^0-9]/g,
            "",
          );
          const waText = encodeURIComponent(
            `Halo ${studioInfo?.studioName || "Paranam Lumina Studio"}, saya ingin daftar paket "${pkg.name}" (${pkg.totalSessions} sesi - Rp ${pkg.price.toLocaleString("id-ID")}).`,
          );
          return (
            <div
              key={pkg.id}
              className="bg-white rounded-3xl border border-[#E6E2D8] p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4 hover:border-[#4D7762]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D7762] bg-[#E9EFEA] px-2.5 py-0.5 rounded-full">
                    {pkg.totalSessions} Sesi Studio
                  </span>
                  <span className="text-[11px] font-semibold text-[#5D6E66]">
                    Aktif {pkg.validityDays} Hari
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#162620] mt-3">
                  {pkg.name}
                </h3>
                {pkg.description && (
                  <p className="text-xs text-[#5D6E66] mt-1 leading-relaxed">
                    {pkg.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#F0EDE5] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A8881] block">
                    Tarif Paket
                  </span>
                  <span className="text-base font-extrabold text-[#162620]">
                    Rp {pkg.price.toLocaleString("id-ID")}
                  </span>
                </div>
                <a
                  href={`https://wa.me/${waNum}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#4D7762] hover:bg-[#3B6251] text-white text-xs font-bold transition-colors touch-manipulation shrink-0"
                >
                  Daftar Paket
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
