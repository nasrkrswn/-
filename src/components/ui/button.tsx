import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-600",
  secondary: "bg-ink-900 text-white shadow-sm hover:bg-ink-700 focus-visible:ring-ink-900",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
  ghost: "bg-transparent text-ink-700 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-ink-500",
  outline: "border border-ink-200 bg-white text-ink-700 shadow-sm hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-ink-500"
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
