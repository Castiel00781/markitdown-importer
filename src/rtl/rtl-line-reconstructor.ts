import { rtlCharacterRatio } from "./rtl-detector";
import { analyzeRtlLine, normalizeRtlWord } from "./rtl-normalizer";

export interface PositionedTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function isLtr(item: PositionedTextItem): boolean {
  return rtlCharacterRatio(item.text) === 0 && /[A-Za-z0-9\u0660-\u0669\u06f0-\u06f9]/u.test(item.text);
}

function restoreLtrRuns(items: PositionedTextItem[]): PositionedTextItem[] {
  const restored = [...items];
  for (let start = 0; start < restored.length;) {
    if (!isLtr(restored[start]!)) {
      start += 1;
      continue;
    }
    let end = start + 1;
    while (end < restored.length && isLtr(restored[end]!)) end += 1;
    const run = restored.slice(start, end);
    if (run.some((item) => /[A-Za-z]/u.test(item.text)) && run.length > 1) {
      restored.splice(start, run.length, ...run.reverse());
    }
    start = end;
  }
  return restored;
}

function join(items: PositionedTextItem[]): string {
  return items.map((item) => normalizeRtlWord(item.text)).filter(Boolean).join(" ").replace(/\s+([,.;:!?%،؛؟)\]}»])/gu, "$1").replace(/(\(|\[|\{|«)\s+/gu, "$1");
}

export function reconstructPositionedLine(items: PositionedTextItem[]): { text: string; usedCoordinates: boolean; confidence: number } {
  if (items.length === 0) return { text: "", usedCoordinates: false, confidence: 0 };
  const ascending = [...items].sort((a, b) => a.x - b.x);
  const ltr = join(ascending);
  if (rtlCharacterRatio(ltr) < 0.45) return { text: ltr, usedCoordinates: false, confidence: 1 };

  const rtl = join(restoreLtrRuns([...ascending].reverse()));
  const ltrAnalysis = analyzeRtlLine(ltr);
  const rtlAnalysis = analyzeRtlLine(rtl);
  const ltrQuality = ltrAnalysis.originalQuality;
  const rtlQuality = rtlAnalysis.originalQuality;
  const difference = Math.abs(rtlQuality - ltrQuality);
  const text = ltrQuality > rtlQuality + 0.2 ? ltr : rtl;
  return { text, usedCoordinates: true, confidence: Math.min(1, 0.55 + difference / 8) };
}

export function groupPositionedLines(items: PositionedTextItem[]): PositionedTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PositionedTextItem[][] = [];
  for (const item of sorted) {
    const line = lines.at(-1);
    if (!line) {
      lines.push([item]);
      continue;
    }
    const averageY = line.reduce((sum, current) => sum + current.y, 0) / line.length;
    const tolerance = Math.max(2, Math.min(6, item.height * 0.4));
    if (Math.abs(item.y - averageY) <= tolerance) line.push(item);
    else lines.push([item]);
  }
  return lines;
}
