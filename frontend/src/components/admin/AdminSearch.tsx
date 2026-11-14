type AdminSearchProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AdminSearch({ id, label, value, onChange, placeholder }: AdminSearchProps) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <input
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "Search"}
        type="search"
        value={value}
      />
    </label>
  );
}
