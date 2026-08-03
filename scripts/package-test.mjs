import archiver from "archiver";
import { createWriteStream, existsSync, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const required = ["main.js", "manifest.json", "styles.css"];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing runtime file: ${file}`);
}
const version = JSON.parse(readFileSync("manifest.json", "utf8")).version;
const suffix = process.argv.includes("--release") ? "" : "-test";
const outputPath = path.resolve(`markitdown-importer-${version}${suffix}.zip`);
const output = createWriteStream(outputPath);
const archive = archiver("zip", { zlib: { level: 9 } });
archive.on("warning", (error) => { throw error; });
archive.on("error", (error) => { throw error; });
archive.pipe(output);
for (const file of required) archive.file(file, { name: `markitdown-importer/${file}` });
await archive.finalize();
await new Promise((resolve, reject) => {
  output.on("close", resolve);
  output.on("error", reject);
});
console.log(`Created ${outputPath} (${(await stat(outputPath)).size} bytes)`);
