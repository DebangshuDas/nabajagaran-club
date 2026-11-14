type AdminToastVariant = "success" | "error" | "info";

type AdminToastProps = {
  message: string;
  variant?: AdminToastVariant;
  onDismiss?: () => void;
};

const variantClasses: Record<AdminToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export function AdminToast({ message, variant = "info", onDismiss }: AdminToastProps) {
  const isError = variant === "error";

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm shadow-sm ${variantClasses[variant]}`}
      role={isError ? "alert" : "status"}
    >
      <p>{message}</p>
      {onDismiss && (
        <button
          aria-label="Dismiss notification"
          className="shrink-0 font-semibold opacity-70 hover:opacity-100"
          onClick={onDismiss}
          type="button"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
