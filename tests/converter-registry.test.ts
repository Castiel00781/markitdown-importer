import { describe, expect, it } from "vitest";
import { ConverterRegistry } from "../src/converters/converter-registry";
import { ImportError } from "../src/utils/errors";

describe("converter registry", () => {
  it("rejects unsupported extensions", () => {
    expect(() => new ConverterRegistry([]).get("pptx")).toThrow(ImportError);
  });
});
