type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="mb-6">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-bold tracking-normal text-white">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
          {description}
        </p>
      ) : null}
    </section>
  );
}
