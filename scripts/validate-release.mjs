import { existsSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const requestedVersion = process.argv[2] ?? manifest.version;
if (!requestedVersion || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(requestedVersion)) {
  throw new Error("Pass a semantic release version without a leading v, for example 0.1.0.");
}
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
if (manifest.version !== requestedVersion) throw new Error(`manifest.json version ${manifest.version} does not match ${requestedVersion}.`);
if (packageJson.version !== requestedVersion) throw new Error(`package.json version ${packageJson.version} does not match ${requestedVersion}.`);
if (versions[requestedVersion] !== manifest.minAppVersion) throw new Error("versions.json does not map the release to minAppVersion.");
for (const file of ["main.js", "manifest.json", "styles.css"]) {
  if (!existsSync(file)) throw new Error(`Missing BRAT release asset: ${file}`);
}
console.log(`Release ${requestedVersion} is valid for BRAT.`);
