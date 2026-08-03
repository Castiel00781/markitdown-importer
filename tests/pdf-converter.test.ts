import { describe, expect, it } from "vitest";
import { hasMeaningfulPdfText } from "../src/converters/pdf-converter";

describe("PDF empty extraction detection", () => {
  it("classifies image-only extraction as non-meaningful", () => {
    expect(hasMeaningfulPdfText(" \n <!-- page --> ")).toBe(false);
    expect(hasMeaningfulPdfText("Meaningful report text")).toBe(true);
  });
});
