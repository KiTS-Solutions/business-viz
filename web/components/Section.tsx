import type { ReactNode } from "react";

export function Section({
  title,
  children,
  first,
  last,
  level = 2,
}: {
  title: string;
  children: ReactNode;
  first?: boolean;
  last?: boolean;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const headingClassName = level === 2 ? "mb-5 font-display text-xl text-ocean" : "mb-4 font-display text-lg text-ocean";

  return (
    <section className={`${first ? "pt-10" : "pt-12"} ${last ? "pb-14" : "border-b border-ocean/10 pb-12"}`}>
      <Heading className={headingClassName}>{title}</Heading>
      {children}
    </section>
  );
}
