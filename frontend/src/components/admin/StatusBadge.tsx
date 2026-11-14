type StatusBadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

type StatusBadgeProps = {
  label: string;
  variant?: StatusBadgeVariant;
};

const variantClasses: Record<StatusBadgeVariant, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
};

export function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}
