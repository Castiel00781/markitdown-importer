import JSZip from "jszip";
import type { DataAdapter } from "obsidian";
import { describe, expect, it } from "vitest";
import { extractOcrArchive } from "../src/services/ocr-asset-extractor";

describe("embedded OCR asset extraction", () => {
  it("writes nested archive files through the Vault adapter", async () => {
    const archive = new JSZip();
    archive.file("core/engine.wasm", new Uint8Array([1, 2, 3]));
    archive.file("lang/fas.traineddata.gz", new Uint8Array([4, 5]));
    const base64 = await archive.generateAsync({ type: "base64" });
    const directories = new Set<string>();
    const files = new Map<string, Uint8Array>();
    const adapter = {
      exists: async (path: string) => directories.has(path) || files.has(path),
      mkdir: async (path: string) => { directories.add(path); },
      writeBinary: async (path: string, data: ArrayBuffer) => { files.set(path, new Uint8Array(data)); },
    } as unknown as DataAdapter;

    await extractOcrArchive(adapter, ".obsidian/plugins/markitdown-importer/ocr", base64);

    expect(files.get(".obsidian/plugins/markitdown-importer/ocr/core/engine.wasm")).toEqual(new Uint8Array([1, 2, 3]));
    expect(files.get(".obsidian/plugins/markitdown-importer/ocr/lang/fas.traineddata.gz")).toEqual(new Uint8Array([4, 5]));
  });

  it("rejects archive traversal paths", async () => {
    const archive = new JSZip();
    archive.file("../outside.wasm", new Uint8Array([1]));
    const adapter = {
      exists: async () => false,
      mkdir: async () => undefined,
      writeBinary: async () => undefined,
    } as unknown as DataAdapter;
    await expect(extractOcrArchive(adapter, ".obsidian/plugins/markitdown-importer/ocr", await archive.generateAsync({ type: "base64" }))).rejects.toThrow("Unsafe OCR archive path");
  });
});
