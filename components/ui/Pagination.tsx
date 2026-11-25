"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem =
    itemsPerPage && totalItems !== undefined
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#E6E2D8] bg-white px-4 py-3 sm:px-6 mt-5 rounded-2xl shadow-sm">
      {/* Info */}
      <div className="text-xs font-medium text-[#5D6E66] text-center sm:text-left">
        {startItem !== null && endItem !== null && totalItems !== undefined ? (
          <>
            Menampilkan{" "}
            <span className="font-bold text-[#162620]">
              {startItem}–{endItem}
            </span>{" "}
            dari <span className="font-bold text-[#162620]">{totalItems}</span>{" "}
            data · Halaman{" "}
            <span className="font-bold text-[#162620]">{currentPage}</span>/
            {totalPages}
          </>
        ) : (
          <>
            Halaman{" "}
            <span className="font-bold text-[#162620]">{currentPage}</span> dari{" "}
            <span className="font-bold text-[#162620]">{totalPages}</span>
          </>
        )}
      </div>

      {/* Mobile Prev/Next */}
      <div className="flex w-full sm:hidden items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex-1 inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-[#DCD7CA] bg-[#F6F4EF] px-3 py-2.5 text-xs font-bold text-[#162620] hover:bg-[#E9EFEA] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          Sebelumnya
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex-1 inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-[#4D7762] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#3F6451] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
        >
          Selanjutnya
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </div>

      {/* Desktop Numbered Controls */}
      <nav
        className="hidden sm:inline-flex items-center gap-1"
        aria-label="Pagination"
      >
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center rounded-xl w-9 h-9 border border-[#DCD7CA] text-[#162620] hover:bg-[#F6F4EF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`inline-flex items-center justify-center rounded-xl w-9 h-9 text-xs font-bold transition-colors cursor-pointer ${
              currentPage === page
                ? "bg-[#4D7762] text-white shadow-sm"
                : "text-[#162620] border border-[#E6E2D8] hover:bg-[#F6F4EF]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center rounded-xl w-9 h-9 border border-[#DCD7CA] text-[#162620] hover:bg-[#F6F4EF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Selanjutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
