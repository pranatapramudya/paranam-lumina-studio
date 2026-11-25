export default function RootLoading() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#162620] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      {/* Logo mark */}
      <div className="w-16 h-16 rounded-3xl bg-[#3B6251]/30 border border-[#3B6251]/50 flex items-center justify-center mb-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a3c4b0"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 animate-pulse"
        >
          {/* Lotus / yoga pose simplified */}
          <path d="M12 22c0 0-8-4.5-8-11a8 8 0 0 1 16 0c0 6.5-8 11-8 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </div>

      <p className="text-[#F6F4EF] font-black text-base tracking-tight mb-1">
        Paranam Lumina Studio
      </p>
      <p className="text-[#6B9C82] text-xs font-semibold tracking-wide">
        Yoga · Pilates · Sound Healing · Depok
      </p>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-6">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#3B6251] animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#3B6251] animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#3B6251] animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
