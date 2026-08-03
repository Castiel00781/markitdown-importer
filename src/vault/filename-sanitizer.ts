const INVALID_FILENAME = /[\\/:*?"<>|\u0000-\u001f]/gu;

export function sanitizeFilename(filename: string): string {
  const withoutPath = filename.replace(/^.*[\\/]/u, "");
  const cleaned = withoutPath.normalize("NFC").replace(INVALID_FILENAME, "-").replace(/\s+/gu, " ").replace(/[ .]+$/gu, "").trim();
  const base = cleaned.replace(/\.md$/iu, "") || "Imported document";
  return `${base}.md`;
}
