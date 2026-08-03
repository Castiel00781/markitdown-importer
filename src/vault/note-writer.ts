import { TFile, type Vault } from "obsidian";
import type { ExistingFileBehavior } from "../settings/settings-types";
import { ImportError } from "../utils/errors";
import { buildOutputPath, uniqueVaultPath } from "./output-path";

export type ConflictDecision = "overwrite" | "unique" | "cancel";

async function ensureFolder(vault: Vault, folder: string, createAutomatically: boolean): Promise<void> {
  if (!folder || vault.getAbstractFileByPath(folder)) return;
  if (!createAutomatically) throw new ImportError("OUTPUT_FOLDER_FAILED", `The Vault folder "${folder}" does not exist.`);
  try {
    await vault.createFolder(folder);
  } catch (error) {
    if (!vault.getAbstractFileByPath(folder)) throw new ImportError("OUTPUT_FOLDER_FAILED", "The output folder could not be created.", { cause: error });
  }
}

export async function writeNote(
  vault: Vault,
  folder: string,
  filename: string,
  content: string,
  behavior: ExistingFileBehavior,
  createFolderAutomatically: boolean,
  resolveConflict: (path: string) => Promise<ConflictDecision>,
): Promise<TFile> {
  const requestedPath = buildOutputPath(folder, filename);
  const normalizedFolder = requestedPath.includes("/") ? requestedPath.slice(0, requestedPath.lastIndexOf("/")) : "";
  await ensureFolder(vault, normalizedFolder, createFolderAutomatically);
  let outputPath = requestedPath;
  const existing = vault.getAbstractFileByPath(outputPath);
  let effectiveBehavior = behavior;
  if (existing && behavior === "ask") {
    const decision = await resolveConflict(outputPath);
    if (decision === "cancel") throw new ImportError("CANCELLED", "Import cancelled.");
    effectiveBehavior = decision;
  }
  if (existing && effectiveBehavior === "unique") outputPath = uniqueVaultPath(vault, outputPath);
  const target = vault.getAbstractFileByPath(outputPath);
  if (target) {
    if (!(target instanceof TFile)) throw new ImportError("EXISTING_NOTE", "A folder already uses the requested note path.");
    if (effectiveBehavior !== "overwrite") throw new ImportError("EXISTING_NOTE", "A note already exists at the requested path.");
    await vault.modify(target, content);
    return target;
  }
  return vault.create(outputPath, content);
}
