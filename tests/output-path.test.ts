import { describe, expect, it } from "vitest";
import { buildOutputPath, uniqueOutputPath } from "../src/vault/output-path";

describe("output paths", () => {
  it("normalizes folder separators", () => {
    expect(buildOutputPath("/Imports\\PDF/", "گزارش.md")).toBe("Imports/PDF/گزارش.md");
  });

  it("creates a unique filename", () => {
    const occupied = new Set(["Imports/report.md", "Imports/report 2.md"]);
    expect(uniqueOutputPath("Imports/report.md", (path) => occupied.has(path))).toBe("Imports/report 3.md");
  });

  it("rejects paths outside the Vault", () => {
    expect(() => buildOutputPath("../private", "report.md")).toThrow("inside the current Vault");
  });
});
