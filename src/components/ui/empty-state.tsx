import { cn } from "@/components/ui/cn";

export function EmptyState({ title, className }: { title: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-40 items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 text-center text-sm font-medium text-ink-500",
        className
      )}
    >
      {title}
    </div>
  );
}
