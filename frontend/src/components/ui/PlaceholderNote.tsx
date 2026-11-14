import type { ReactNode } from "react";

export function PlaceholderNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-gold pl-4 text-sm leading-relaxed text-muted">{children}</p>
  );
}
