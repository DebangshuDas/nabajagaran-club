import { Link } from "react-router-dom";

type CtaBandProps = {
  title: string;
  text: string;
  action: string;
  to: string;
};

export function CtaBand({ title, text, action, to }: CtaBandProps) {
  return (
    <section className="bg-maroon text-ivory">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 md:flex-row md:items-end md:justify-between md:px-8 md:py-20">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">Membership</p>
          <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{title}</h2>
          <p className="mt-4 leading-relaxed text-ivory/80">{text}</p>
        </div>
        <Link
          to={to}
          className="inline-flex items-center justify-center bg-gold px-6 py-3 text-sm font-medium tracking-wide text-maroon-dark transition hover:bg-gold-soft"
        >
          {action}
        </Link>
      </div>
    </section>
  );
}
