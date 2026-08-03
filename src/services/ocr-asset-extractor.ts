import JSZip from "jszip";
import type { DataAdapter } from "obsidian";

function normalizeVaultPath(path: string): string {
  return path.replace(/\\/gu, "/").replace(/\/{2,}/gu, "/").replace(/^\/+|\/+$/gu, "");
}

async function ensureDirectory(adapter: DataAdapter, directory: string): Promise<void> {
  let current = "";
  for (const segment of normalizeVaultPath(directory).split("/")) {
    current = current ? `${current}/${segment}` : segment;
    if (!(await adapter.exists(current))) await adapter.mkdir(current);
  }
}

export async function extractOcrArchive(adapter: DataAdapter, ocrDirectory: string, archiveBase64: string, signal?: AbortSignal): Promise<void> {
  const archive = await JSZip.loadAsync(archiveBase64, { base64: true, checkCRC32: true });
  if (signal?.aborted) throw signal.reason;
  await ensureDirectory(adapter, ocrDirectory);
  for (const [relativePath, entry] of Object.entries(archive.files)) {
    if (entry.dir) continue;
    const originalPath = (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName ?? relativePath;
    const segments = originalPath.replace(/\\/gu, "/").split("/");
    if (originalPath.startsWith("/") || segments.includes("..") || /^[A-Za-z]:/u.test(originalPath)) {
      throw new Error(`Unsafe OCR archive path: ${originalPath}`);
    }
    if (signal?.aborted) throw signal.reason;
    const destination = normalizeVaultPath(`${ocrDirectory}/${relativePath}`);
    await ensureDirectory(adapter, destination.slice(0, destination.lastIndexOf("/")));
    const bytes = await entry.async("uint8array");
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    if (signal?.aborted) throw signal.reason;
    await adapter.writeBinary(destination, data);
  }
}
