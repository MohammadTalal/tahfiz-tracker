export type CsvValue = string | number | null | undefined;

// Spreadsheet apps run cells starting with these as formulas ("CSV injection").
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Builds a CSV document. Starts with a UTF-8 byte order mark so Excel shows
 * Arabic correctly, and neutralises cells that would run as formulas.
 */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  const lines = [header, ...rows].map((row) => row.map(cell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
