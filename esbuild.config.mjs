import esbuild from "esbuild";
import { rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import JSZip from "jszip";

const production = process.argv[2] === "production";
const ocrRuntimeAssets = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ...["tesseract-core-lstm", "tesseract-core-simd-lstm", "tesseract-core-relaxedsimd-lstm"].flatMap((name) => [
    [`node_modules/tesseract.js-core/${name}.wasm.js`, `core/${name}.wasm.js`],
    [`node_modules/tesseract.js-core/${name}.wasm`, `core/${name}.wasm`],
  ]),
  ...["fas", "ara", "eng"].map((language) => [
    `node_modules/@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`,
    `lang/${language}.traineddata.gz`,
  ]),
];

let embeddedOcrModule;
async function createEmbeddedOcrModule() {
  if (embeddedOcrModule) return embeddedOcrModule;
  const archive = new JSZip();
  const fixedDate = new Date("2000-01-01T00:00:00.000Z");
  for (const [source, destination] of ocrRuntimeAssets) archive.file(destination, await readFile(source), { date: fixedDate, createFolders: false });
  const bytes = await archive.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 }, platform: "DOS" });
  const base64 = bytes.toString("base64");
  const version = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const paths = ocrRuntimeAssets.map(([, destination]) => destination);
  embeddedOcrModule = `let archive = ${JSON.stringify(base64)};\nconst paths = ${JSON.stringify(paths)};\nexport function getEmbeddedOcrArchive() { return archive; }\nexport function getEmbeddedOcrAssetPaths() { return paths; }\nexport function getEmbeddedOcrAssetVersion() { return ${JSON.stringify(version)}; }\nexport function releaseEmbeddedOcrArchive() { archive = \"\"; }`;
  return embeddedOcrModule;
}

const embeddedOcrPlugin = {
  name: "embedded-ocr-assets",
  setup(build) {
    build.onStart(() => { embeddedOcrModule = undefined; });
    build.onResolve({ filter: /^virtual:ocr-assets$/ }, () => ({ path: "embedded-ocr-assets", namespace: "ocr-assets" }));
    build.onLoad({ filter: /.*/, namespace: "ocr-assets" }, async () => ({
      contents: await createEmbeddedOcrModule(),
      loader: "js",
      watchFiles: ocrRuntimeAssets.map(([source]) => source),
    }));
  },
};

const context = await esbuild.context({
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs",
  target: "es2022",
  platform: "browser",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  logLevel: "info",
  define: { "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development") },
  plugins: [embeddedOcrPlugin],
});

if (production) {
  await context.rebuild();
  await context.dispose();
  rmSync("ocr", { recursive: true, force: true });
} else {
  await context.watch();
}
