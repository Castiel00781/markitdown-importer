import { describe, expect, it } from "vitest";
import { normalizeRtlText } from "../src/rtl/rtl-normalizer";

describe("RTL normalization", () => {
  it("leaves valid Persian logical text unchanged", () => {
    const text = "گزارش اولیه گزینه‌های ورود مینو فارس به حوزه دانش‌بنیان";
    expect(normalizeRtlText(text).text).toBe(text);
  });

  it("repairs a generally detected reversed Persian extraction", () => {
    const reversed = "ناینبشناد هزوح هب سراف ونیم دورو یاههنیزگ هیلوا شرازگ";
    expect(normalizeRtlText(reversed).text).toBe("گزارش اولیه گزینه‌های ورود مینو فارس به حوزه دانش‌بنیان");
  });

  it("repairs reversed Arabic when confidence is high", () => {
    expect(normalizeRtlText("حضاو يبرع ريرقت اذه").text).toBe("هذا تقریر عربی واضح");
  });

  it.each([
    "نسخه MarkItDown 1.2.3 آماده است",
    "گزارش سال ۱۴۰۵ (نسخه 2.1.0)",
    "تاریخ 2026-08-03 و مقدار ۱۲٫۵",
    "ایمیل user@example.com و نشانی https://example.com/a?q=1",
    "دانش‌بنیان و گزینه‌های نهایی",
    "English-only text (version 1.2.3)",
  ])("preserves mixed, protected, numeric, and English content: %s", (text) => {
    expect(normalizeRtlText(text).text).toBe(text);
  });

  it("normalizes conservative Arabic character variants", () => {
    expect(normalizeRtlText("كتاب يحيى").text).toBe("کتاب یحیی");
  });

  it("does not alter code fences or YAML front matter", () => {
    const markdown = "---\ntitle: گزارش\n---\n\n```js\nconst متن = 'ناینبشناد';\n```";
    expect(normalizeRtlText(markdown).text).toBe(markdown);
  });

  it("adds HTML wrappers only when requested", () => {
    const result = normalizeRtlText("گزارش اولیه آماده است", "html");
    expect(result.text).toContain('<div dir="rtl" align="right">');
  });
});
