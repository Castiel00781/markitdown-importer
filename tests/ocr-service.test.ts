import { describe, expect, it } from "vitest";
import { ocrRenderScale } from "../src/services/ocr-service";

describe("OCR page rendering", () => {
  it("uses two-times rendering for ordinary PDF pages", () => {
    expect(ocrRenderScale(612, 792)).toBe(2);
  });

  it("limits unusually large pages to sixteen million pixels", () => {
    const scale = ocrRenderScale(10_000, 10_000);
    expect(scale).toBeCloseTo(0.4);
    expect(10_000 * scale * 10_000 * scale).toBeCloseTo(16_000_000);
  });
});
