export default function TiketLoading() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#F6F4EF] flex flex-col font-sans animate-pulse">
      <div className="w-full h-36 bg-[#4D7762]" />
      <div className="w-full h-16 bg-white border-b border-[#E6E2D8]" />
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-72 bg-white rounded-3xl border border-[#E6E2D8]" />
        <div className="h-72 bg-white rounded-3xl border border-[#E6E2D8]" />
        <div className="h-72 bg-white rounded-3xl border border-[#E6E2D8] hidden lg:block" />
      </div>
    </div>
  );
}
