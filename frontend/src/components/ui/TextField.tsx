type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  required?: boolean;
  autoComplete?: string;
};

const controlClass =
  "mt-2 w-full border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-gold";

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete,
}: TextFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-maroon"> *</span> : null}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
      />
    </label>
  );
}

type TextAreaFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function TextAreaField({ id, label, value, onChange, required = false }: TextAreaFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-maroon"> *</span> : null}
      </span>
      <textarea
        id={id}
        name={id}
        required={required}
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
      />
    </label>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

export function SelectField({ id, label, value, onChange, options }: SelectFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
