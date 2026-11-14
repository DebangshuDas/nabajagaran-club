type AdminPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: AdminPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        {totalItems === 0 ? "0 records" : `${firstItem}–${lastItem} of ${totalItems}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <span aria-live="polite" className="min-w-20 text-center text-sm text-slate-600">
          Page {page} of {pageCount}
        </span>
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
