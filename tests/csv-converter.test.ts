import { describe, expect, it } from "vitest";
import { CsvConverter, parseCsv } from "../src/converters/csv-converter";

describe("CSV conversion", () => {
  it("parses quoted commas, quotes, Persian text, and empty cells", () => {
    expect(parseCsv('نام,توضیح,مقدار\nمینو,"الف, ب",\n"گزارش ""نهایی""",متن,۱۲')).toEqual([
      ["نام", "توضیح", "مقدار"], ["مینو", "الف, ب", ""], ["گزارش \"نهایی\"", "متن", "۱۲"],
    ]);
  });

  it("produces a Markdown table", async () => {
    const result = await new CsvConverter().convert(new TextEncoder().encode("name,value\nA,1"), {
      sourceName: "data.csv", rtlCorrection: "automatic", rtlFormatting: "plain", pdfPageSeparators: "comments",
      ocrEnabled: true, ensureOcrAssets: async (_signal) => "app://local/ocr",
      signal: new AbortController().signal, onProgress: () => undefined,
    });
    expect(result.markdown).toContain("| name | value |");
    expect(result.markdown).toContain("| A | 1 |");
  });
});
