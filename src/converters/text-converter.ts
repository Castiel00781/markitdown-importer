import type { ConversionContext, ConversionResult, DocumentConverter, SourceType } from "../types/conversion";
import { ImportError } from "../utils/errors";
import { decodeUtf8 } from "../utils/text";
import { finalizeTextConversion } from "./converter";

export class TextConverter implements DocumentConverter {
  readonly supportedExtensions = ["txt", "md"];

  async convert(input: ArrayBuffer | Uint8Array, context: ConversionContext): Promise<ConversionResult> {
    let text: string;
    try {
      text = decodeUtf8(input);
    } catch (error) {
      throw new ImportError("READ_FAILED", "This text file could not be decoded as UTF-8.", { cause: error });
    }
    const sourceType: SourceType = context.sourceName.toLocaleLowerCase().endsWith(".md") ? "markdown" : "text";
    return finalizeTextConversion(text, sourceType, context);
  }
}
