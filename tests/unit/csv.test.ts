import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

const body = (csv: string) => csv.replace(/^﻿/, "");

describe("toCsv", () => {
  it("starts with a BOM and uses CRLF line endings", () => {
    const csv = toCsv(["a", "b"], [[1, "x"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(body(csv)).toBe("a,b\r\n1,x\r\n");
  });

  it("quotes commas, quotes and new lines", () => {
    expect(body(toCsv(["v"], [["a,b"], ['say "hi"'], ["line1\nline2"]]))).toBe(
      'v\r\n"a,b"\r\n"say ""hi"""\r\n"line1\nline2"\r\n',
    );
  });

  it("neutralises formula-like text", () => {
    expect(body(toCsv(["v"], [["=HYPERLINK(1)"], ["+1"], ["-2"], ["@x"]]))).toBe(
      "v\r\n'=HYPERLINK(1)\r\n'+1\r\n'-2\r\n'@x\r\n",
    );
  });

  it("keeps numbers and Arabic text as they are", () => {
    expect(
      body(
        toCsv(
          ["n", "name"],
          [
            [-5, "أحمد"],
            [null, undefined],
          ],
        ),
      ),
    ).toBe("n,name\r\n-5,أحمد\r\n,\r\n");
  });
});
