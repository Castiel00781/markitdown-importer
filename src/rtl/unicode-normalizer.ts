const VARIANTS: Record<string, string> = { ي: "ی", ى: "ی", ك: "ک" };

export function normalizeUnicode(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[يىك]/gu, (character) => VARIANTS[character] ?? character)
    .replace(/\u00ad/gu, "-");
}
