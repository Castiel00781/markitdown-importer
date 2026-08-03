import type { ConversionContext, ConversionResult, SourceType } from "../types/conversion";
import { emptyRtlReport } from "../types/conversion";
import { normalizeRtlText } from "../rtl/rtl-normalizer";
import { sourceTitle } from "../utils/text";

export function finalizeTextConversion(
  markdown: string,
  sourceType: SourceType,
  context: ConversionContext,
  warnings: string[] = [],
  metadata: Record<string, string | number | boolean> = {},
): ConversionResult {
  if (context.rtlCorrection === "disabled") {
    return { markdown, title: sourceTitle(context.sourceName), sourceType, warnings, metadata, rtlProcessingReport: emptyRtlReport() };
  }
  const normalized = normalizeRtlText(markdown, context.rtlFormatting);
  return {
    markdown: normalized.text,
    title: sourceTitle(context.sourceName),
    sourceType,
    warnings: [...warnings, ...normalized.warnings],
    metadata,
    rtlProcessingReport: normalized.report,
  };
}
