import { rtlCharacterRatio } from "./rtl-detector";
import { normalizeUnicode } from "./unicode-normalizer";

function compact(text: string): string {
  return normalizeUnicode(text).replace(/\u200c/gu, "").replace(/[\s\p{P}\p{S}]/gu, "").toLocaleLowerCase();
}

export function reverseGraphemes(text: string): string {
  const segmenter = new Intl.Segmenter("fa", { granularity: "grapheme" });
  return Array.from(segmenter.segment(text), ({ segment }) => segment).reverse().join("");
}

export function areReverseEquivalent(first: string, second: string): boolean {
  if (rtlCharacterRatio(first) < 0.35 || rtlCharacterRatio(second) < 0.35) return false;
  return compact(first) === compact(reverseGraphemes(second));
}
