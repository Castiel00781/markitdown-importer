import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "../src/vault/filename-sanitizer";

describe("filename sanitization", () => {
  it("preserves Persian and Arabic Unicode", () => {
    expect(sanitizeFilename("گزارش نهایی.pdf")).toBe("گزارش نهایی.pdf.md");
  });

  it("removes path components and replaces invalid characters", () => {
    expect(sanitizeFilename("C:\\private\\report:2026?.md")).toBe("report-2026-.md");
  });

  it("adds the Markdown extension once", () => {
    expect(sanitizeFilename("note.MD")).toBe("note.md");
  });
});
