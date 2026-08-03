export type SourceType = "pdf" | "docx" | "html" | "text" | "markdown" | "csv";

export type RtlCorrectionMode = "automatic" | "disabled";
export type RtlFormattingMode = "plain" | "html" | "automatic";
export type RtlCorrectionState =
  | "unchanged"
  | "normalized"
  | "reordered"
  | "partially repaired"
  | "duplicate removed"
  | "uncertain";

export interface RtlProcessingReport {
  rtlCharacterRatio: number;
  state: RtlCorrectionState;
  confidence: number;
  repairedLines: number;
  duplicatesRemoved: number;
  uncertainLines: number;
  htmlBlocksAdded: number;
  coordinateReconstructionUsed: boolean;
}

export interface ConversionProgress {
  message: string;
  current?: number;
  total?: number;
}

export interface ConversionContext {
  sourceName: string;
  rtlCorrection: RtlCorrectionMode;
  rtlFormatting: RtlFormattingMode;
  pdfPageSeparators: "none" | "comments" | "headings";
  ocrEnabled: boolean;
  ensureOcrAssets?: (signal: AbortSignal) => Promise<string>;
  signal: AbortSignal;
  onProgress: (progress: ConversionProgress) => void;
}

export interface ConversionResult {
  markdown: string;
  title: string;
  sourceType: SourceType;
  warnings: string[];
  metadata: Record<string, string | number | boolean>;
  rtlProcessingReport: RtlProcessingReport;
}

export interface DocumentConverter {
  readonly supportedExtensions: readonly string[];
  convert(input: ArrayBuffer | Uint8Array, context: ConversionContext): Promise<ConversionResult>;
}

export function emptyRtlReport(): RtlProcessingReport {
  return {
    rtlCharacterRatio: 0,
    state: "unchanged",
    confidence: 0,
    repairedLines: 0,
    duplicatesRemoved: 0,
    uncertainLines: 0,
    htmlBlocksAdded: 0,
    coordinateReconstructionUsed: false,
  };
}
