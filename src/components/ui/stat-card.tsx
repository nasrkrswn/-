import { cn } from "@/components/ui/cn";

export function StatCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    default: "border-ink-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50",
    danger: "border-rose-200 bg-rose-50",
    info: "border-sky-200 bg-sky-50"
  };

  const accents = {
    default: "bg-ink-300",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500"
  };

  return (
    <div className={cn("relative overflow-hidden rounded-lg border p-4 shadow-soft", tones[tone])}>
      <span className={cn("absolute inset-y-4 right-0 w-1 rounded-l-full", accents[tone])} aria-hidden />
      <div className="pr-3">
        <p className="text-sm font-semibold text-ink-600">{label}</p>
        <p className="mt-2 text-3xl font-bold text-ink-900">{value}</p>
      </div>
    </div>
  );
}
