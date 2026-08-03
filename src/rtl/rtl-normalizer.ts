import type { RtlFormattingMode, RtlProcessingReport } from "../types/conversion";
import { areReverseEquivalent, reverseGraphemes } from "./duplicate-line-detector";
import { ARABIC_SCRIPT, ARABIC_WORD, isProtectedLtrToken, isRtlParagraph, rtlCharacterRatio } from "./rtl-detector";
import { normalizeUnicode } from "./unicode-normalizer";

const KNOWN_WORDS = new Set([
  "از", "است", "این", "با", "برای", "به", "بود", "تاریخ", "تا", "دانش", "دانشبنیان", "دانش‌بنیان", "در", "را", "سال", "شد", "شده", "شماره", "شاخص", "فارس", "گزارش", "ماه", "مقدار", "مینو", "نسخه", "نصب", "نهایی", "ردیف", "ورود", "و", "عملکرد", "اولیه", "گزینه", "گزینهها", "گزینه‌های", "حوزه", "دوم", "صفحه", "آماده",
  "هذا", "هذه", "تقرير", "عربي", "العربية", "واضح", "في", "من", "إلى", "على", "هو", "هي", "كان", "تم", "عام", "النص", "النهائي",
]);
const SUSPICIOUS_PREFIXES = ["یاه", "نیرت", "شرازگ", "هخسن", "ريرقت", "اذه"];
const TOKEN_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|[A-Za-z][A-Za-z0-9_.+/-]*|[0-9\u0660-\u0669\u06f0-\u06f9]+(?:[./:-][0-9\u0660-\u0669\u06f0-\u06f9]+)*|[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u200c\u200d\ufb50-\ufdff\ufe70-\ufeff]+|[^\s]/gu;

export interface LineAnalysis {
  rtlRatio: number;
  confidence: number;
  originalQuality: number;
  repairedQuality: number;
  predominantlyRtl: boolean;
  shouldRepair: boolean;
}

function wordQuality(word: string): number {
  const compact = word.replace(/[^\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u200c]/gu, "");
  if (!compact) return 0;
  const plain = compact.replace(/\u200c/gu, "");
  let score = KNOWN_WORDS.has(compact) || KNOWN_WORDS.has(plain) ? 2.4 : 0;
  if (compact.startsWith("ال") && compact.length > 3) score += 0.45;
  if (/^(?:می‌|نمی‌)/u.test(compact)) score += 0.6;
  if (/(?:ها|های|تر|ترین|ان|ات|ون|ین|ة)$/u.test(compact)) score += 0.25;
  if (SUSPICIOUS_PREFIXES.some((prefix) => compact.startsWith(prefix))) score -= 1.35;
  return score;
}

export function logicalQualityScore(text: string): number {
  const normalized = normalizeUnicode(text);
  const words = normalized.match(ARABIC_WORD) ?? [];
  let score = words.reduce((sum, word) => sum + wordQuality(word), 0);
  const stripped = normalized.trim();
  if (/[.!?؟]$/u.test(stripped)) score += 0.45;
  if (/^[.!?؟]/u.test(stripped)) score -= 0.75;
  return score;
}

function reversalCandidate(line: string): string {
  const tokens = line.match(TOKEN_PATTERN) ?? [];
  const reversed = tokens.reverse().map((token) => {
    if (isProtectedLtrToken(token) || !ARABIC_SCRIPT.test(token)) return token;
    return reverseGraphemes(token);
  });
  return reversed.join(" ").replace(/\s+([,.;:!?%،؛؟)\]}»])/gu, "$1").replace(/(\(|\[|\{|«)\s+/gu, "$1");
}

export function analyzeRtlLine(line: string): LineAnalysis {
  const normalized = normalizeUnicode(line);
  const ratio = rtlCharacterRatio(normalized);
  const words = normalized.match(ARABIC_WORD) ?? [];
  const originalQuality = logicalQualityScore(normalized);
  if (ratio < 0.45 || words.length < 2) {
    return { rtlRatio: ratio, confidence: 0, originalQuality, repairedQuality: originalQuality, predominantlyRtl: false, shouldRepair: false };
  }
  const candidate = reversalCandidate(normalized);
  const repairedQuality = logicalQualityScore(candidate);
  const improvement = repairedQuality - originalQuality;
  const required = Math.max(2.8, words.length * 0.35);
  const suspicious = words.filter((word) => SUSPICIOUS_PREFIXES.some((prefix) => word.replace(/\u200c/gu, "").startsWith(prefix))).length;
  let confidence = Math.max(0, Math.min(1, improvement / Math.max(required * 1.35, 1)));
  if (suspicious > 0) confidence = Math.min(1, confidence + Math.min(0.22, (suspicious / words.length) * 0.3));
  return { rtlRatio: ratio, confidence, originalQuality, repairedQuality, predominantlyRtl: true, shouldRepair: improvement >= required && confidence >= 0.68 };
}

function repairKnownSpacing(text: string): string {
  return text.replace(/گزینهه?ای|گزینههای/gu, "گزینه‌های").replace(/دانش(?:ب|ب‌|‌ب)نیان/gu, "دانش‌بنیان");
}

export function normalizeRtlWord(word: string): string {
  const normalized = normalizeUnicode(word);
  if (!ARABIC_SCRIPT.test(normalized)) return normalized;
  const candidate = reverseGraphemes(normalized);
  return repairKnownSpacing(logicalQualityScore(candidate) >= logicalQualityScore(normalized) + 1.35 ? candidate : normalized);
}

function shouldPreserveVerbatim(line: string, index: number, inFence: boolean, inFrontMatter: boolean): boolean {
  const trimmed = line.trim();
  return inFence || inFrontMatter || (index === 0 && trimmed === "---") || /^\s*```/u.test(line) || /^\s*\|.*\|\s*$/u.test(line) || /^\s*https?:\/\/\S+\s*$/iu.test(line);
}

function addRtlBlocks(text: string): { text: string; count: number } {
  let count = 0;
  let inFence = false;
  let inFrontMatter = false;
  const output: string[] = [];
  text.split("\n").forEach((line, index) => {
    const trimmed = line.trim();
    if (index === 0 && trimmed === "---") inFrontMatter = true;
    if (/^```/u.test(trimmed)) {
      inFence = !inFence;
      output.push(line);
      return;
    }
    if (inFrontMatter) {
      output.push(line);
      if (index > 0 && trimmed === "---") inFrontMatter = false;
      return;
    }
    const unsafe = inFence || !trimmed || trimmed.includes("|") || /^(?:#|>|<|https?:\/\/)/iu.test(trimmed);
    if (!unsafe && isRtlParagraph(trimmed)) {
      output.push(`<div dir="rtl" align="right">\n\n${trimmed}\n\n</div>`);
      count += 1;
    } else output.push(line);
  });
  return { text: output.join("\n"), count };
}

export function normalizeRtlText(text: string, formatting: RtlFormattingMode = "plain"): { text: string; report: RtlProcessingReport; warnings: string[] } {
  const normalizedInput = normalizeUnicode(text);
  const report: RtlProcessingReport = {
    rtlCharacterRatio: rtlCharacterRatio(normalizedInput), state: normalizedInput === text ? "unchanged" : "normalized", confidence: 0,
    repairedLines: 0, duplicatesRemoved: 0, uncertainLines: 0, htmlBlocksAdded: 0, coordinateReconstructionUsed: false,
  };
  const warnings: string[] = [];
  const output: string[] = [];
  let previousSource = "";
  let inFence = false;
  let inFrontMatter = false;
  normalizedInput.split(/\r?\n/u).forEach((sourceLine, index) => {
    const trimmed = sourceLine.trim();
    const preserve = shouldPreserveVerbatim(sourceLine, index, inFence, inFrontMatter);
    if (index === 0 && trimmed === "---") inFrontMatter = true;
    if (/^\s*```/u.test(sourceLine)) inFence = !inFence;
    if (inFrontMatter && index > 0 && trimmed === "---") inFrontMatter = false;
    if (preserve) {
      output.push(sourceLine);
      previousSource = "";
      return;
    }
    if (!trimmed) {
      output.push("");
      previousSource = "";
      return;
    }
    const analysis = analyzeRtlLine(sourceLine);
    report.confidence = Math.max(report.confidence, analysis.confidence);
    const line = repairKnownSpacing(analysis.shouldRepair ? reversalCandidate(sourceLine) : sourceLine).replace(/[\t ]+/gu, " ").trim();
    if (analysis.shouldRepair) {
      report.repairedLines += 1;
      report.state = "reordered";
    } else if (analysis.predominantlyRtl && analysis.confidence >= 0.35) {
      report.uncertainLines += 1;
      report.state = "uncertain";
    }
    if (previousSource && areReverseEquivalent(previousSource, sourceLine)) {
      const prior = output.at(-1) ?? "";
      if (logicalQualityScore(line) > logicalQualityScore(prior)) output[output.length - 1] = line;
      report.duplicatesRemoved += 1;
      report.state = "duplicate removed";
    } else output.push(line);
    previousSource = sourceLine;
  });
  let result = output.join("\n").replace(/\n{3,}/gu, "\n\n").trim();
  if (formatting === "html" || (formatting === "automatic" && report.rtlCharacterRatio >= 0.6)) {
    const formatted = addRtlBlocks(result);
    result = formatted.text;
    report.htmlBlocksAdded = formatted.count;
  }
  if (report.uncertainLines > 0) warnings.push(`${report.uncertainLines} RTL line(s) were preserved because correction confidence was low.`);
  return { text: result, report, warnings };
}
