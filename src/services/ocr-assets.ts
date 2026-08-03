import type { DataAdapter } from "obsidian";
import { getEmbeddedOcrArchive, getEmbeddedOcrAssetPaths, getEmbeddedOcrAssetVersion, releaseEmbeddedOcrArchive } from "virtual:ocr-assets";
import { ImportError } from "../utils/errors";
import { extractOcrArchive } from "./ocr-asset-extractor";

export async function ensureEmbeddedOcrAssets(adapter: DataAdapter, pluginDirectory: string, signal?: AbortSignal): Promise<string> {
  const ocrDirectory = `${pluginDirectory.replace(/\\/gu, "/").replace(/\/+$/u, "")}/ocr`;
  const marker = `${ocrDirectory}/.assets-${getEmbeddedOcrAssetVersion()}`;
  const requiredAssets = getEmbeddedOcrAssetPaths().map((path) => `${ocrDirectory}/${path}`);
  const assetsComplete = await adapter.exists(marker) && (await Promise.all(requiredAssets.map((path) => adapter.exists(path)))).every(Boolean);
  if (!assetsComplete) {
    const archiveBase64 = getEmbeddedOcrArchive();
    if (!archiveBase64) throw new ImportError("OCR_FAILED", "Embedded OCR resources are unavailable.");
    try {
      await extractOcrArchive(adapter, ocrDirectory, archiveBase64, signal);
      await adapter.write(marker, `${getEmbeddedOcrAssetVersion()}\n`);
      releaseEmbeddedOcrArchive();
    } catch (error) {
      throw new ImportError("OCR_FAILED", "Embedded OCR resources could not be prepared.", { cause: error });
    }
  }
  releaseEmbeddedOcrArchive();
  return adapter.getResourcePath(ocrDirectory);
}
