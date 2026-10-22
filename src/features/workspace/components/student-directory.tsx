"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useDeferredValue, useState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export type DirectoryRow = {
  id: string;
  /** Lower-cased text the search box matches against (names, parents, teachers, phones). */
  search: string;
  classIds: string[];
  content: ReactNode;
};

const NO_CLASS = "none";

/** Search and class filter over server-rendered student rows. */
export function StudentDirectory({
  rows,
  classes,
}: {
  rows: DirectoryRow[];
  classes: { id: string; name: string }[];
}) {
  const t = useTranslations("Students");
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const visible = rows.filter(
    (r) =>
      (!deferredQuery || r.search.includes(deferredQuery)) &&
      (!classId || (classId === NO_CLASS ? r.classIds.length === 0 : r.classIds.includes(classId))),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="text-subtle-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="ps-9"
          />
        </div>
        <NativeSelect
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          aria-label={t("filterClass")}
          className="sm:w-56"
        >
          <option value="">{t("allClasses")}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          {rows.some((r) => r.classIds.length === 0) && <option value={NO_CLASS}>{t("withoutClass")}</option>}
        </NativeSelect>
      </div>

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {t("showing", { shown: visible.length, total: rows.length })}
      </p>

      {visible.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          {t("noMatches")}
        </p>
      ) : (
        <ul className="bg-card divide-y overflow-hidden rounded-xl border shadow-(--shadow-soft)">
          {visible.map((r) => (
            <li key={r.id}>{r.content}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
