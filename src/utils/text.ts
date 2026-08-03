export function sourceTitle(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export function toArrayBuffer(input: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input;
  return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
}

export function decodeUtf8(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch (error) {
    throw new Error("The file is not valid UTF-8 text.", { cause: error });
  }
}

export function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|").trim();
}
