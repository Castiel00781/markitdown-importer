import * as mammoth from "mammoth";
import type { ConversionContext, ConversionResult, DocumentConverter } from "../types/conversion";
import { ImportError } from "../utils/errors";
import { toArrayBuffer } from "../utils/text";
import { finalizeTextConversion } from "./converter";
import { htmlToMarkdown } from "./html-converter";

export class DocxConverter implements DocumentConverter {
  readonly supportedExtensions = ["docx"];

  async convert(input: ArrayBuffer | Uint8Array, context: ConversionContext): Promise<ConversionResult> {
    context.onProgress({ message: "Reading DOCX document..." });
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: toArrayBuffer(input) });
      const warnings = result.messages.map((message) => message.message);
      return finalizeTextConversion(htmlToMarkdown(result.value), "docx", context, warnings);
    } catch (error) {
      throw new ImportError("PARSER_ERROR", "The DOCX document could not be converted.", { cause: error });
    }
  }
}
