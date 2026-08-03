import TurndownService from "turndown";
import type { ConversionContext, ConversionResult, DocumentConverter } from "../types/conversion";
import { ImportError } from "../utils/errors";
import { decodeUtf8 } from "../utils/text";
import { finalizeTextConversion } from "./converter";

export function sanitizeHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script, iframe, object, embed, form, link, meta, base").forEach((element) => element.remove());
  document.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const value = attribute.value.trim();
      if (/^on/iu.test(attribute.name) || (/^(?:href|src)$/iu.test(attribute.name) && /^javascript:/iu.test(value))) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return document.body.innerHTML;
}

export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced" });
  turndown.keep(["table", "thead", "tbody", "tr", "th", "td"]);
  return turndown.turndown(sanitizeHtml(html)).trim();
}

export class HtmlConverter implements DocumentConverter {
  readonly supportedExtensions = ["html", "htm"];

  async convert(input: ArrayBuffer | Uint8Array, context: ConversionContext): Promise<ConversionResult> {
    try {
      return finalizeTextConversion(htmlToMarkdown(decodeUtf8(input)), "html", context);
    } catch (error) {
      throw new ImportError("PARSER_ERROR", "The HTML document could not be converted.", { cause: error });
    }
  }
}
