export const ARABIC_SCRIPT = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u;
export const ARABIC_WORD = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u200c\u200d\ufb50-\ufdff\ufe70-\ufeff]+/gu;

export function rtlCharacterRatio(text: string): number {
  const visible = Array.from(text).filter((character) => /[\p{L}\p{N}]/u.test(character));
  if (visible.length === 0) return 0;
  return visible.filter((character) => ARABIC_SCRIPT.test(character)).length / visible.length;
}

export function isProtectedLtrToken(token: string): boolean {
  return /^(?:https?:\/\/\S+|www\.\S+)$/iu.test(token)
    || /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/u.test(token)
    || /^[A-Za-z][A-Za-z0-9_.+/-]*$/u.test(token)
    || /^[0-9\u0660-\u0669\u06f0-\u06f9]+(?:[./:-][0-9\u0660-\u0669\u06f0-\u06f9]+)*$/u.test(token);
}

export function isRtlParagraph(text: string): boolean {
  return rtlCharacterRatio(text) >= 0.45;
}
