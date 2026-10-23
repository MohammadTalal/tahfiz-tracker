"use client";

import { type KeyboardEvent, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export const WHEEL_ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const PAD = ((VISIBLE_ITEMS - 1) / 2) * WHEEL_ITEM_HEIGHT;

export type WheelItem<T> = { value: T; label: string };

/**
 * One column of an iPhone-style picker: scroll (or flick) and the item in
 * the middle band is selected; tapping an item selects it too. Arrow keys
 * work when focused. The band itself is drawn by the parent so several
 * wheels share it.
 */
export function Wheel<T extends string | number>({
  label,
  items,
  value,
  onChange,
  className,
  itemClassName,
}: {
  label: string;
  items: WheelItem<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  className?: string;
  itemClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrolling = useRef(false);
  const mounted = useRef(false);
  const id = useId();
  const index = items.findIndex((i) => i.value === value);

  // Keep the selected item in the band when the value or the list changes.
  useEffect(() => {
    const el = ref.current;
    if (!el || index < 0 || scrolling.current) return;
    const top = index * WHEEL_ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - top) > 1) {
      el.scrollTo({ top, behavior: mounted.current ? "smooth" : "instant" });
    }
    mounted.current = true;
  }, [index, items.length]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  function onScroll() {
    scrolling.current = true;
    clearTimeout(settleTimer.current);
    // Once the flick settles (scroll snapping does the alignment), pick the
    // item in the band.
    settleTimer.current = setTimeout(() => {
      scrolling.current = false;
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT)));
      const picked = items[i];
      if (picked && picked.value !== value) onChange(picked.value);
    }, 120);
  }

  function onKeyDown(e: KeyboardEvent) {
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = items[Math.min(items.length - 1, Math.max(0, (index < 0 ? 0 : index) + step))];
    if (next) onChange(next.value);
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      aria-activedescendant={index >= 0 ? `${id}-${index}` : undefined}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      className={cn(
        "focus-visible:ring-ring relative snap-y snap-mandatory [scrollbar-width:none] overflow-y-auto overscroll-contain rounded-lg focus-visible:ring-2 focus-visible:outline-none [&::-webkit-scrollbar]:hidden",
        className,
      )}
      style={{
        height: VISIBLE_ITEMS * WHEEL_ITEM_HEIGHT,
        paddingBlock: PAD,
        // Fade items toward the top and bottom, like a real wheel.
        maskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
      }}
    >
      {items.map((item, i) => (
        <div
          key={String(item.value)}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === index}
          onClick={() => {
            // A tap wins over a scroll that is still settling.
            clearTimeout(settleTimer.current);
            scrolling.current = false;
            onChange(item.value);
          }}
          className={cn(
            "flex cursor-pointer snap-center items-center justify-center truncate px-1 transition-colors duration-150 select-none",
            i === index ? "text-foreground text-lg font-semibold" : "text-muted-foreground text-base",
            itemClassName,
          )}
          style={{ height: WHEEL_ITEM_HEIGHT }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
