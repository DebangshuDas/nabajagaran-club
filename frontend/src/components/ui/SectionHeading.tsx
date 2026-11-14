type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  text?: string;
  light?: boolean;
};

export function SectionHeading({ eyebrow, title, text, light = false }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p
        className={`text-xs font-medium tracking-[0.22em] uppercase ${light ? "text-gold" : "text-maroon"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 font-display text-4xl leading-tight md:text-5xl ${light ? "text-ivory" : "text-maroon"}`}
      >
        {title}
      </h2>
      {text ? (
        <p className={`mt-4 text-base leading-relaxed ${light ? "text-ivory/80" : "text-muted"}`}>
          {text}
        </p>
      ) : null}
    </div>
  );
}
