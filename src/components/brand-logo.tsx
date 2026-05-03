import { ClipboardCheck } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { brand } from "@/lib/brand";

type BrandLogoTone = "dark" | "light";
type BrandLogoSize = "sm" | "md" | "lg";

const sizes: Record<BrandLogoSize, { mark: string; icon: string; name: string; subtitle: string }> = {
  sm: {
    mark: "h-9 w-9 rounded-lg",
    icon: "h-5 w-5",
    name: "text-base",
    subtitle: "text-[11px]"
  },
  md: {
    mark: "h-11 w-11 rounded-lg",
    icon: "h-6 w-6",
    name: "text-lg",
    subtitle: "text-xs"
  },
  lg: {
    mark: "h-12 w-12 rounded-xl",
    icon: "h-7 w-7",
    name: "text-2xl",
    subtitle: "text-sm"
  }
};

const toneClasses = {
  dark: {
    name: "text-ink-900",
    subtitle: "text-ink-500",
    image: "bg-white shadow-soft",
    mark: "bg-brand-600 text-white shadow-soft ring-1 ring-brand-100"
  },
  light: {
    name: "text-white",
    subtitle: "text-emerald-100",
    image: "bg-white/95 shadow-soft",
    mark: "bg-brand-500 text-white shadow-soft ring-1 ring-white/15"
  }
};

export function BrandLogo({
  tone = "dark",
  size = "md",
  subtitle = "نظام الحضور والانصراف",
  showSubtitle = true,
  className
}: {
  tone?: BrandLogoTone;
  size?: BrandLogoSize;
  subtitle?: string;
  showSubtitle?: boolean;
  className?: string;
}) {
  const currentSize = sizes[size];
  const currentTone = toneClasses[tone];

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logoUrl}
          alt={brand.name}
          className={cn(currentSize.mark, "object-contain p-1", currentTone.image)}
        />
      ) : (
        <span className={cn("grid shrink-0 place-items-center", currentSize.mark, currentTone.mark)} aria-hidden>
          <ClipboardCheck className={currentSize.icon} />
        </span>
      )}

      <span className="grid min-w-0 gap-0.5 text-right leading-none">
        <span className={cn("truncate font-extrabold tracking-normal", currentSize.name, currentTone.name)}>
          {brand.name}
        </span>
        {showSubtitle ? (
          <span className={cn("truncate font-semibold leading-5", currentSize.subtitle, currentTone.subtitle)}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </div>
  );
}
