import type { App, TFile } from "obsidian";
import { ConverterRegistry } from "../converters/converter-registry";
import type { ConversionProgress, RtlCorrectionMode, RtlFormattingMode } from "../types/conversion";
import type { ExistingFileBehavior, MarkItDownImporterSettings } from "../settings/settings-types";
import { ImportError } from "../utils/errors";
import { writeNote, type ConflictDecision } from "../vault/note-writer";
import type { Logger } from "./logger";
import type { SelectedInputFile } from "./file-picker";

export interface ImportRequest {
  input: SelectedInputFile;
  outputFolder: string;
  outputFilename: string;
  rtlCorrection: RtlCorrectionMode;
  rtlFormatting: RtlFormattingMode;
  openAfterImport: boolean;
  existingFileBehavior: ExistingFileBehavior;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function frontMatter(request: ImportRequest, settings: MarkItDownImporterSettings, sourceType: string, rtlProcessed: boolean): string {
  if (!settings.includeSourceMetadata && !settings.includeImportTimestamp) return "";
  const lines = ["---"];
  if (settings.includeSourceMetadata) {
    lines.push(`source_file: ${yamlString(settings.addSourcePathToFrontMatter ? request.input.absolutePath : request.input.name)}`);
    lines.push(`source_format: ${yamlString(sourceType)}`);
    lines.push(`converter: ${yamlString("MarkItDown Importer")}`);
    lines.push(`rtl_processing: ${rtlProcessed}`);
  }
  if (settings.includeImportTimestamp) lines.push(`imported_at: ${yamlString(new Date().toISOString())}`);
  lines.push("---", "");
  return lines.join("\n");
}

export class ImportService {
  private readonly registry = new ConverterRegistry();

  constructor(
    private readonly app: App,
    private readonly settings: MarkItDownImporterSettings,
    private readonly logger: Logger,
    private readonly ensureOcrAssets: (signal: AbortSignal) => Promise<string>,
  ) {}

  async import(
    request: ImportRequest,
    signal: AbortSignal,
    onProgress: (progress: ConversionProgress) => void,
    resolveConflict: (path: string) => Promise<ConflictDecision>,
  ): Promise<{ file: TFile; warnings: string[] }> {
    const extension = request.input.name.split(".").at(-1)?.toLocaleLowerCase() ?? "";
    if (!extension) throw new ImportError("INVALID_INPUT", "Select a supported input file.");
    const converter = this.registry.get(extension);
    try {
      const result = await converter.convert(request.input.data, {
        sourceName: request.input.name,
        rtlCorrection: request.rtlCorrection,
        rtlFormatting: request.rtlFormatting,
        pdfPageSeparators: this.settings.pdfPageSeparators,
        ocrEnabled: this.settings.ocrScannedPdfFallback,
        ensureOcrAssets: this.ensureOcrAssets,
        signal,
        onProgress,
      });
      const prefix = frontMatter(request, this.settings, result.sourceType, result.rtlProcessingReport.rtlCharacterRatio > 0);
      onProgress({ message: "Writing note to the Vault..." });
      const file = await writeNote(this.app.vault, request.outputFolder, request.outputFilename, `${prefix}${result.markdown}\n`, request.existingFileBehavior, this.settings.createOutputFolderAutomatically, resolveConflict);
      if (request.openAfterImport) await this.app.workspace.getLeaf(false).openFile(file);
      return { file, warnings: result.warnings };
    } catch (error) {
      this.logger.debug("Import failed", error);
      throw error;
    }
  }
}
