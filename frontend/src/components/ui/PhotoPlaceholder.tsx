import type { PhotoTone } from "../../data/site";

const tones: Record<PhotoTone, string> = {
  maroon: "from-maroon-dark via-maroon to-[#8d3b32]",
  night: "from-[#140d10] via-maroon-dark to-[#3a1a22]",
  gold: "from-[#6d4d16] via-[#b5893a] to-maroon",
  ivory: "from-[#c9b59a] via-[#a78462] to-[#6e4638]",
};

type PhotoPlaceholderProps = {
  label: string;
  tone?: PhotoTone;
  className?: string;
};

export function PhotoPlaceholder({
  label,
  tone = "maroon",
  className = "",
}: PhotoPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative overflow-hidden bg-gradient-to-br ${tones[tone]} ${className}`}
    >
      <div className="alpana absolute inset-0 opacity-70" />
      <div className="absolute inset-3 border border-gold/50 sm:inset-4" />
      <div className="absolute inset-5 border border-ivory/15 sm:inset-7" />
      <p className="absolute right-6 bottom-5 left-6 font-display text-xl text-ivory sm:text-2xl">
        {label}
      </p>
    </div>
  );
}
