declare module "virtual:ocr-assets" {
  export function getEmbeddedOcrArchive(): string;
  export function getEmbeddedOcrAssetPaths(): string[];
  export function getEmbeddedOcrAssetVersion(): string;
  export function releaseEmbeddedOcrArchive(): void;
}
