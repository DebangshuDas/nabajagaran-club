type AdminFormActionsProps = {
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
};

export function AdminFormActions({
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}: AdminFormActionsProps) {
  return (
    <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
      <button
        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        disabled={isSubmitting}
        onClick={onCancel}
        type="button"
      >
        {cancelLabel}
      </button>
      <button
        className="rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641925] disabled:cursor-wait disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
