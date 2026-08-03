import { describe, expect, it } from "vitest";
import { areReverseEquivalent } from "../src/rtl/duplicate-line-detector";
import { normalizeRtlText } from "../src/rtl/rtl-normalizer";

describe("duplicate reversed lines", () => {
  const logical = "گزارش اولیه گزینه‌های ورود مینو فارس به حوزه دانش‌بنیان";
  const reversed = "ناینبشناد هزوح هب سراف ونیم دورو یاههنیزگ هیلوا شرازگ";

  it("detects a reverse-equivalent adjacent line", () => {
    expect(areReverseEquivalent(logical, reversed)).toBe(true);
  });

  it("keeps the higher-quality logical line", () => {
    const result = normalizeRtlText(`${logical}\n${reversed}`);
    expect(result.text).toBe(logical);
    expect(result.report.duplicatesRemoved).toBe(1);
  });

  it("does not remove distinct Persian lines", () => {
    expect(normalizeRtlText("گزارش اولیه آماده است\nگزارش نهایی آماده است").text.split("\n")).toHaveLength(2);
  });
});
