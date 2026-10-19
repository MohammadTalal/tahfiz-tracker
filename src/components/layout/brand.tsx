import { cn } from "@/lib/utils";

/** The app's emblem: an eight-point star (khatam) in emerald with a gold centre. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        {/* Eight-point star (khatam): two overlapping squares. */}
        <rect x="5.5" y="5.5" width="13" height="13" rx="0.5" />
        <rect x="5.5" y="5.5" width="13" height="13" rx="0.5" transform="rotate(45 12 12)" />
        <circle cx="12" cy="12" r="2.4" fill="var(--gold)" stroke="none" />
      </svg>
    </span>
  );
}
