import type { RtlFormattingMode } from "../types/conversion";

export type ExistingFileBehavior = "ask" | "unique" | "overwrite";

export interface MarkItDownImporterSettings {
  defaultOutputFolder: string;
  createOutputFolderAutomatically: boolean;
  rtlCorrectionEnabled: boolean;
  rtlFormattingMode: RtlFormattingMode;
  openNoteAfterImport: boolean;
  existingFileBehavior: ExistingFileBehavior;
  includeSourceMetadata: boolean;
  includeImportTimestamp: boolean;
  addSourcePathToFrontMatter: boolean;
  pdfPageSeparators: "none" | "comments" | "headings";
  ocrScannedPdfFallback: boolean;
  debugLogging: boolean;
}

export const DEFAULT_SETTINGS: MarkItDownImporterSettings = {
  defaultOutputFolder: "Imports",
  createOutputFolderAutomatically: true,
  rtlCorrectionEnabled: true,
  rtlFormattingMode: "plain",
  openNoteAfterImport: true,
  existingFileBehavior: "ask",
  includeSourceMetadata: true,
  includeImportTimestamp: true,
  addSourcePathToFrontMatter: false,
  pdfPageSeparators: "comments",
  ocrScannedPdfFallback: true,
  debugLogging: false,
};
