export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-2 border-r-4 border-brand-600 pr-4">
        <h1 className="text-2xl font-bold text-ink-900 md:text-3xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-7 text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
