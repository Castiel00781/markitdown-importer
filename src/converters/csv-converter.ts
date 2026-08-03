import type { ConversionContext, ConversionResult, DocumentConverter } from "../types/conversion";
import { ImportError } from "../utils/errors";
import { decodeUtf8, escapeMarkdownTableCell } from "../utils/text";
import { finalizeTextConversion } from "./converter";

const MAX_CSV_BYTES = 10 * 1024 * 1024;
const MAX_CSV_ROWS = 10_000;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new ImportError("PARSER_ERROR", "The CSV file contains an unclosed quoted field.");
  if (field || row.length > 0) {
    row.push(field.replace(/\r$/u, ""));
    rows.push(row);
  }
  return rows;
}

function csvToMarkdown(rows: string[][]): string {
  if (rows.length === 0) return "";
  const columns = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => Array.from({ length: columns }, (_, index) => escapeMarkdownTableCell(row[index] ?? "")));
  const first = normalized[0]!;
  return [
    `| ${first.join(" | ")} |`,
    `| ${first.map(() => "---").join(" | ")} |`,
    ...normalized.slice(1).map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

export class CsvConverter implements DocumentConverter {
  readonly supportedExtensions = ["csv"];

  async convert(input: ArrayBuffer | Uint8Array, context: ConversionContext): Promise<ConversionResult> {
    const size = input instanceof Uint8Array ? input.byteLength : input.byteLength;
    if (size > MAX_CSV_BYTES) throw new ImportError("INVALID_INPUT", "This CSV is too large to import safely (10 MB maximum).");
    let text: string;
    try {
      text = decodeUtf8(input);
    } catch (error) {
      throw new ImportError("READ_FAILED", "This CSV could not be decoded as UTF-8.", { cause: error });
    }
    const rows = parseCsv(text);
    if (rows.length > MAX_CSV_ROWS) throw new ImportError("INVALID_INPUT", "This CSV has too many rows to import safely (10,000 maximum).");
    if (rows.length === 0) throw new ImportError("EMPTY_EXTRACTION", "The CSV file is empty.");
    return finalizeTextConversion(csvToMarkdown(rows), "csv", context, [], { rows: rows.length, headerDetected: true });
  }
}
