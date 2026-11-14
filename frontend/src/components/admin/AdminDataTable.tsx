import type { Key, ReactNode } from "react";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";

export type AdminDataTableColumn<T> = {
  id: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
};

type AdminDataTableProps<T> = {
  columns: readonly AdminDataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => Key;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadingMessage?: string;
};

export function AdminDataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  error = null,
  emptyMessage = "No records found.",
  loadingMessage = "Loading records...",
}: AdminDataTableProps<T>) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th className={`px-4 py-3 ${column.className ?? ""}`} key={column.id} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr className="text-slate-700" key={getRowKey(row)}>
              {columns.map((column) => (
                <td className={`px-4 py-3 ${column.className ?? ""}`} key={column.id}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
