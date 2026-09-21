import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-slate-900 text-white",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  destructive: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  outline: "bg-white text-slate-700 border border-slate-200",
};

export function Badge({
  variant = "slate",
  className,
  ...p
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  const variantClass = variants[variant] || variants.slate;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClass,
        className
      )}
      {...p}
    />
  );
}