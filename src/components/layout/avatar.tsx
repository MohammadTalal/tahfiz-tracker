import { cn } from "@/lib/utils";

/** Initial-letter avatar (no photos are collected). */
export function InitialAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initial = Array.from(name.trim())[0] ?? "؟";
  return (
    <span
      aria-hidden
      className={cn(
        "bg-mint text-primary-strong grid shrink-0 place-items-center rounded-full font-semibold",
        size === "sm" && "size-8 text-sm",
        size === "md" && "size-10",
        size === "lg" && "size-14 text-xl",
      )}
    >
      {initial}
    </span>
  );
}
