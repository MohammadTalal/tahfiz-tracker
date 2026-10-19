import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Styled native <select>: keeps the phone's own picker (fast and accessible
 * on mobile) while matching the Input look. Direction-aware chevron.
 */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        {...props}
        className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 h-10 w-full min-w-0 appearance-none rounded-lg border ps-3 pe-9 text-base transition-colors duration-150 outline-none focus-visible:ring-3 aria-invalid:ring-3 md:text-sm"
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
        aria-hidden
      />
    </div>
  );
}
