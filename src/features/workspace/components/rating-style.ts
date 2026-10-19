import { Check, CircleCheck, CircleDashed, Star, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Database } from "@/types/database";

type Rating = Database["public"]["Enums"]["performance_rating"];

/** Each rating has an icon as well as a color, so meaning never relies on color alone. */
export const RATING_STYLE: Record<
  Rating,
  { icon: LucideIcon; badge: "success" | "mint" | "warning" | "destructive"; dot: string; selected: string }
> = {
  excellent: {
    icon: Star,
    badge: "success",
    dot: "bg-success",
    selected: "has-checked:border-success has-checked:bg-success-soft has-checked:text-success",
  },
  very_good: {
    icon: CircleCheck,
    badge: "success",
    dot: "bg-success",
    selected: "has-checked:border-success has-checked:bg-success-soft has-checked:text-success",
  },
  good: {
    icon: Check,
    badge: "mint",
    dot: "bg-primary",
    selected: "has-checked:border-primary has-checked:bg-mint has-checked:text-primary-strong",
  },
  needs_improvement: {
    icon: TriangleAlert,
    badge: "warning",
    dot: "bg-warning",
    selected: "has-checked:border-warning has-checked:bg-warning-soft has-checked:text-warning",
  },
  not_completed: {
    icon: CircleDashed,
    badge: "destructive",
    dot: "bg-destructive",
    selected: "has-checked:border-destructive has-checked:bg-destructive-soft has-checked:text-destructive",
  },
};
