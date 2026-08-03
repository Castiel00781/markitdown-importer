import type { Vault } from "obsidian";
import { ImportError } from "../utils/errors";
import { sanitizeFilename } from "./filename-sanitizer";

export function buildOutputPath(folder: string, filename: string): string {
  const safeFolder = folder.trim().replace(/\\/gu, "/").replace(/\/{2,}/gu, "/").replace(/^\/+|\/+$/gu, "");
  if (safeFolder.split("/").some((segment) => segment === "..")) {
    throw new ImportError("OUTPUT_FOLDER_FAILED", "The output folder must be inside the current Vault.");
  }
  const safeFilename = sanitizeFilename(filename);
  return safeFolder ? `${safeFolder}/${safeFilename}` : safeFilename;
}

export function uniqueOutputPath(path: string, exists: (candidate: string) => boolean): string {
  if (!exists(path)) return path;
  const extensionIndex = path.toLocaleLowerCase().lastIndexOf(".md");
  const stem = extensionIndex >= 0 ? path.slice(0, extensionIndex) : path;
  for (let suffix = 2; suffix < 100_000; suffix += 1) {
    const candidate = `${stem} ${suffix}.md`;
    if (!exists(candidate)) return candidate;
  }
  throw new Error("Could not find an available output filename.");
}

export function uniqueVaultPath(vault: Vault, path: string): string {
  return uniqueOutputPath(path, (candidate) => vault.getAbstractFileByPath(candidate) !== null);
}
