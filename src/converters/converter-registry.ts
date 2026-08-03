import type { DocumentConverter } from "../types/conversion";
import { ImportError } from "../utils/errors";
import { CsvConverter } from "./csv-converter";
import { DocxConverter } from "./docx-converter";
import { HtmlConverter } from "./html-converter";
import { PdfConverter } from "./pdf-converter";
import { TextConverter } from "./text-converter";

export class ConverterRegistry {
  private readonly converters = new Map<string, DocumentConverter>();

  constructor(converters: DocumentConverter[] = [new PdfConverter(), new DocxConverter(), new HtmlConverter(), new TextConverter(), new CsvConverter()]) {
    for (const converter of converters) {
      for (const extension of converter.supportedExtensions) this.converters.set(extension.toLocaleLowerCase(), converter);
    }
  }

  get(extension: string): DocumentConverter {
    const converter = this.converters.get(extension.replace(/^\./u, "").toLocaleLowerCase());
    if (!converter) throw new ImportError("UNSUPPORTED_EXTENSION", `Files with the .${extension.replace(/^\./u, "")} extension are not supported.`);
    return converter;
  }

  supports(extension: string): boolean {
    return this.converters.has(extension.replace(/^\./u, "").toLocaleLowerCase());
  }
}
