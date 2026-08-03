import { createWorker, OEM, type Worker } from "tesseract.js";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import type { ConversionContext } from "../types/conversion";
import { ImportError, throwIfCancelled } from "../utils/errors";

const OCR_LANGUAGES = ["fas", "ara", "eng"];
const MAX_RENDER_PIXELS = 16_000_000;

export function ocrRenderScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 2;
  return Math.min(2, Math.sqrt(MAX_RENDER_PIXELS / (width * height)));
}

function assetUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/u, "")}/${path}`;
}

export async function recognizeScannedPdf(document: PDFDocumentProxy, context: ConversionContext): Promise<{ text: string; pages: number }> {
  if (!context.ensureOcrAssets) throw new ImportError("OCR_FAILED", "Offline OCR resources are unavailable.");
  throwIfCancelled(context.signal);
  let worker: Worker | null = null;
  const terminate = (): void => { if (worker) void worker.terminate(); };
  context.signal.addEventListener("abort", terminate, { once: true });
  try {
    context.onProgress({ message: "Preparing offline OCR..." });
    const ocrAssetBaseUrl = await context.ensureOcrAssets(context.signal);
    throwIfCancelled(context.signal);
    worker = await createWorker(OCR_LANGUAGES, OEM.LSTM_ONLY, {
      workerPath: assetUrl(ocrAssetBaseUrl, "worker.min.js"),
      corePath: assetUrl(ocrAssetBaseUrl, "core"),
      langPath: assetUrl(ocrAssetBaseUrl, "lang"),
      cacheMethod: "none",
      gzip: true,
      legacyCore: false,
      legacyLang: false,
      workerBlobURL: true,
      logger: (message) => {
        if (context.signal.aborted) return;
        const percent = Math.round(message.progress * 100);
        context.onProgress({ message: `Preparing offline OCR: ${message.status} (${percent}%)` });
      },
    });
    throwIfCancelled(context.signal);
    await worker.setParameters({ preserve_interword_spaces: "1", user_defined_dpi: "144" });
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      throwIfCancelled(context.signal);
      context.onProgress({ message: `Running OCR on PDF page ${pageNumber} of ${document.numPages}...`, current: pageNumber, total: document.numPages });
      const page = await document.getPage(pageNumber);
      const canvas = window.document.createElement("canvas");
      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: ocrRenderScale(baseViewport.width, baseViewport.height) });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const canvasContext = canvas.getContext("2d", { alpha: false });
        if (!canvasContext) throw new ImportError("OCR_FAILED", "A PDF page could not be prepared for OCR.");
        await page.render({ canvasContext, viewport }).promise;
        throwIfCancelled(context.signal);
        const result = await worker.recognize(canvas);
        throwIfCancelled(context.signal);
        if (result.data.text.trim()) {
          const separator = context.pdfPageSeparators === "comments"
            ? `<!-- Page ${pageNumber} -->`
            : context.pdfPageSeparators === "headings" ? `## Page ${pageNumber}` : "";
          pages.push(separator ? `${separator}\n\n${result.data.text.trim()}` : result.data.text.trim());
        }
      } finally {
        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    return { text: pages.join("\n\n"), pages: document.numPages };
  } catch (error) {
    throwIfCancelled(context.signal);
    if (error instanceof ImportError) throw error;
    throw new ImportError("OCR_FAILED", "Offline OCR could not process this PDF.", { cause: error });
  } finally {
    context.signal.removeEventListener("abort", terminate);
    await worker?.terminate().catch(() => undefined);
  }
}
