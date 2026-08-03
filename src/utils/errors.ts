export type ImportErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_EXTENSION"
  | "READ_FAILED"
  | "CORRUPTED_PDF"
  | "PASSWORD_PROTECTED_PDF"
  | "EMPTY_EXTRACTION"
  | "SCANNED_PDF"
  | "OCR_FAILED"
  | "OUTPUT_FOLDER_FAILED"
  | "EXISTING_NOTE"
  | "CANCELLED"
  | "PARSER_ERROR";

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ImportError";
  }
}

export function throwIfCancelled(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new ImportError("CANCELLED", "Import cancelled.");
  }
}

export function userMessage(error: unknown): string {
  if (error instanceof ImportError) return error.message;
  return "The document could not be imported.";
}
