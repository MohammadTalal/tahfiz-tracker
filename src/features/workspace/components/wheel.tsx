"use client";

import { type KeyboardEvent, useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const WHEEL_ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const PAD = ((VISIBLE_ITEMS - 1) / 2) * WHEEL_ITEM_HEIGHT;
/** Degrees each row is tilted per row away from the middle (the drum's curve). */
const TILT = 25;

export type WheelItem<T> = { value: T; label: string };

const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One column of an iPhone-style picker: scroll (or flick) and the item in
 * the middle band is selected; tapping an item selects it too. Arrow keys
 * work when focused. The band itself is drawn by the parent so several
 * wheels share it.
 *
 * Rows curve away like a drum as they leave the middle. That effect is
 * painted straight onto the rows once per animation frame while scrolling,
 * without re-rendering, so it follows the finger smoothly.
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
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const frame = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrolling = useRef(false);
  const mounted = useRef(false);
  const centered = useRef(-1);
  const id = useId();
  const index = items.findIndex((i) => i.value === value);

  // The latest props, for scroll handlers that outlive a render.
  const latest = useRef({ items, value, onChange });
  useLayoutEffect(() => {
    latest.current = { items, value, onChange };
  });

  /** Tilt, shrink and fade each nearby row by its distance from the middle. */
  const paint = useCallback(() => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    const position = el.scrollTop / WHEEL_ITEM_HEIGHT;
    const flat = reducedMotion();
    const first = Math.max(0, Math.floor(position) - VISIBLE_ITEMS);
    const last = Math.min(rows.current.length - 1, Math.ceil(position) + VISIBLE_ITEMS);
    for (let i = first; i <= last; i++) {
      const row = rows.current[i];
      if (!row) continue;
      const distance = i - position;
      const away = Math.min(Math.abs(distance), 3);
      row.style.transform = flat
        ? ""
        : `perspective(500px) rotateX(${-distance * TILT}deg) scale(${1 - away * 0.08})`;
      row.style.opacity = String(Math.max(0.12, 1 - away * 0.3));
    }
    // A light tick as each row passes the middle (where phones allow it).
    const middle = Math.round(position);
    if (middle !== centered.current) {
      rows.current[centered.current]?.removeAttribute("data-center");
      rows.current[middle]?.setAttribute("data-center", "");
      if (centered.current >= 0 && scrolling.current && canVibrate()) navigator.vibrate(3);
      centered.current = middle;
    }
  }, []);

  /** When the scroll comes to rest (snapping aligns it), pick the middle row. */
  const settle = useCallback(() => {
    clearTimeout(settleTimer.current);
    scrolling.current = false;
    const el = ref.current;
    if (!el) return;
    const { items, value, onChange } = latest.current;
    const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT)));
    const picked = items[i];
    if (picked && picked.value !== value) onChange(picked.value);
  }, []);

  function onScroll() {
    scrolling.current = true;
    if (!frame.current) frame.current = requestAnimationFrame(paint);
    // Fallback for browsers without the "scrollend" event.
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, 150);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || !("onscrollend" in window)) return;
    el.addEventListener("scrollend", settle);
    return () => el.removeEventListener("scrollend", settle);
  }, [settle]);

  useEffect(
    () => () => {
      clearTimeout(settleTimer.current);
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  // Keep the selected item in the band when the value or the list changes,
  // and repaint the curve for the new rows.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (index >= 0 && !scrolling.current) {
      const top = index * WHEEL_ITEM_HEIGHT;
      if (Math.abs(el.scrollTop - top) > 1) {
        el.scrollTo({ top, behavior: mounted.current ? "smooth" : "instant" });
      }
    }
    mounted.current = true;
    centered.current = -1;
    paint();
  }, [index, items, paint]);

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
        // Fade rows toward the top and bottom edges, like a real wheel.
        maskImage: "linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)",
      }}
    >
      {items.map((item, i) => (
        <div
          key={String(item.value)}
          ref={(row) => {
            rows.current[i] = row;
          }}
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
            // The row in the middle band (data-center, set while painting) is dark and bold.
            "text-muted-foreground data-center:text-foreground flex cursor-pointer snap-center items-center justify-center truncate px-1 text-lg will-change-transform select-none data-center:font-semibold",
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
