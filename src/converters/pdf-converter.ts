import "pdfjs-dist/build/pdf.worker.mjs";
import { getDocument, PasswordResponses } from "pdfjs-dist/build/pdf.mjs";
import type { PDFDocumentProxy, TextItem } from "pdfjs-dist/types/src/display/api";
import type { ConversionContext, ConversionResult, DocumentConverter } from "../types/conversion";
import { normalizeRtlText } from "../rtl/rtl-normalizer";
import { groupPositionedLines, reconstructPositionedLine, type PositionedTextItem } from "../rtl/rtl-line-reconstructor";
import { ImportError, throwIfCancelled } from "../utils/errors";
import { sourceTitle, toArrayBuffer } from "../utils/text";
import { recognizeScannedPdf } from "../services/ocr-service";

export function hasMeaningfulPdfText(text: string): boolean {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).length >= 8;
}

function pageSeparator(page: number, mode: ConversionContext["pdfPageSeparators"]): string {
  if (mode === "comments") return `<!-- Page ${page} -->`;
  if (mode === "headings") return `## Page ${page}`;
  return "";
}

function isTextItem(item: unknown): item is TextItem {
  return typeof item === "object" && item !== null && "str" in item && "transform" in item;
}

export class PdfConverter implements DocumentConverter {
  readonly supportedExtensions = ["pdf"];

  async convert(input: ArrayBuffer | Uint8Array, context: ConversionContext): Promise<ConversionResult> {
    const warnings: string[] = [];
    let loadingTask: ReturnType<typeof getDocument> | undefined;
    let document: PDFDocumentProxy | undefined;
    let passwordRequested = false;
    try {
      loadingTask = getDocument({ data: new Uint8Array(toArrayBuffer(input)), isEvalSupported: false, useWorkerFetch: false });
      loadingTask.onPassword = (updatePassword: (password: string) => void, reason: number) => {
        passwordRequested = true;
        updatePassword("");
        if (reason === PasswordResponses.NEED_PASSWORD || reason === PasswordResponses.INCORRECT_PASSWORD) void loadingTask?.destroy();
      };
      document = await loadingTask.promise;
      const pages: string[] = [];
      let coordinateReconstructionUsed = false;
      let lowConfidenceLines = 0;
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        throwIfCancelled(context.signal);
        context.onProgress({ message: `Reading PDF page ${pageNumber} of ${document.numPages}...`, current: pageNumber, total: document.numPages });
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent({ disableNormalization: false });
        const items: PositionedTextItem[] = content.items.filter(isTextItem).map((item) => {
          const transform = item.transform as readonly number[];
          return {
            text: item.str,
            x: transform[4] ?? 0,
            y: transform[5] ?? 0,
            width: item.width,
            height: item.height || Math.abs(transform[3] ?? 0) || 10,
          };
        }).filter((item) => item.text.trim().length > 0);
        const lines = groupPositionedLines(items).map((line) => reconstructPositionedLine(line)).filter((line) => line.text.trim());
        coordinateReconstructionUsed ||= lines.some((line) => line.usedCoordinates);
        lowConfidenceLines += lines.filter((line) => line.usedCoordinates && line.confidence < 0.65).length;
        const separator = pageSeparator(pageNumber, context.pdfPageSeparators);
        const pageText = lines.map((line) => line.text.trim()).join("\n");
        if (pageText) pages.push(separator ? `${separator}\n\n${pageText}` : pageText);
        page.cleanup();
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
      let extracted = pages.join("\n\n");
      let ocrUsed = false;
      if (!hasMeaningfulPdfText(extracted)) {
        if (!context.ocrEnabled) throw new ImportError("SCANNED_PDF", "This PDF appears to contain scanned pages or images and requires OCR.");
        const ocr = await recognizeScannedPdf(document, context);
        extracted = ocr.text;
        ocrUsed = true;
        if (!hasMeaningfulPdfText(extracted)) throw new ImportError("EMPTY_EXTRACTION", "Offline OCR did not find meaningful text in this PDF.");
        warnings.push("Offline OCR was used because the PDF contained no extractable text.");
      }
      if (lowConfidenceLines > 0) warnings.push(`${lowConfidenceLines} positioned RTL line(s) had low reconstruction confidence and were preserved conservatively.`);
      const normalized = context.rtlCorrection === "automatic"
        ? normalizeRtlText(extracted, context.rtlFormatting)
        : { text: extracted, report: { rtlCharacterRatio: 0, state: "unchanged" as const, confidence: 0, repairedLines: 0, duplicatesRemoved: 0, uncertainLines: 0, htmlBlocksAdded: 0, coordinateReconstructionUsed: false }, warnings: [] };
      normalized.report.coordinateReconstructionUsed = coordinateReconstructionUsed;
      return {
        markdown: normalized.text,
        title: sourceTitle(context.sourceName),
        sourceType: "pdf",
        warnings: [...warnings, ...normalized.warnings],
        metadata: { pages: document.numPages, ocrUsed, ocrLanguages: ocrUsed ? "fas+ara+eng" : "" },
        rtlProcessingReport: normalized.report,
      };
    } catch (error) {
      if (error instanceof ImportError) throw error;
      if (passwordRequested) throw new ImportError("PASSWORD_PROTECTED_PDF", "Password-protected PDFs are not supported.", { cause: error });
      const name = error instanceof Error ? error.name : "";
      if (/Password/iu.test(name)) throw new ImportError("PASSWORD_PROTECTED_PDF", "Password-protected PDFs are not supported.", { cause: error });
      throw new ImportError("CORRUPTED_PDF", "The PDF is corrupted or could not be parsed.", { cause: error });
    } finally {
      await document?.destroy().catch(() => undefined);
      if (!document && context.signal.aborted) await loadingTask?.destroy();
    }
  }
}
