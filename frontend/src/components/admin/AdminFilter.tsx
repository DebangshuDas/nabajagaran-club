export type AdminFilterOption = {
  label: string;
  value: string;
};

type AdminFilterProps = {
  id: string;
  label: string;
  value: string;
  options: readonly AdminFilterOption[];
  onChange: (value: string) => void;
};

export function AdminFilter({ id, label, value, options, onChange }: AdminFilterProps) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <select
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
