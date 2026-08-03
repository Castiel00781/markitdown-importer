# Third-Party Notices

MarkItDown Importer includes or bundles the following runtime libraries and their runtime dependencies. Exact resolved versions are recorded in `package-lock.json`.

| Package | License | Purpose |
| --- | --- | --- |
| `pdfjs-dist` (Mozilla PDF.js) | Apache-2.0 | Local PDF parsing and positioned text extraction |
| `mammoth` | BSD-2-Clause | Local DOCX-to-HTML conversion |
| `turndown` | MIT | Sanitized HTML-to-Markdown conversion |
| `tesseract.js` | Apache-2.0 | Offline OCR worker orchestration |
| `tesseract.js-core` | Apache-2.0 | Bundled Tesseract WebAssembly OCR engine |
| `@tesseract.js-data/fas`, `ara`, `eng` | MIT | Bundled Persian, Arabic, and English trained data |
| `bmp-js`, `idb-keyval`, `is-url` | MIT | Tesseract.js browser utilities |
| `node-fetch`, `whatwg-url`, `tr46` | MIT | Tesseract.js resource-loading compatibility code |
| `webidl-conversions` | BSD-2-Clause | URL compatibility utility |
| `regenerator-runtime`, `wasm-feature-detect`, `zlibjs` | MIT | Tesseract.js runtime and decompression support |
| `@xmldom/xmldom` | MIT | XML processing used by Mammoth |
| `base64-js` | MIT | Binary utility used by Mammoth dependencies |
| `bluebird` | MIT | Promise utility used by Mammoth |
| `dingbat-to-unicode` | MIT | DOCX symbol conversion used by Mammoth |
| `jszip` | MIT or GPL-3.0-or-later | ZIP container processing used by Mammoth; used under MIT |
| `pako` | MIT and Zlib | Compression used by JSZip |
| `lie` | MIT | Promise support used by JSZip |
| `immediate` | MIT | Scheduling support used by `lie` |
| `underscore` | MIT | Utility functions used by Mammoth |
| `argparse` | MIT | Argument parsing dependency used by Mammoth |
| `sprintf-js` | BSD-3-Clause | String formatting used by `argparse` |
| `lop`, `option` | BSD-2-Clause | Parser utilities used by Mammoth |
| `duck` | BSD | Parser matching utility used by `lop` |
| `path-is-absolute` | MIT | Path utility used by Mammoth |
| `xmlbuilder` | MIT | XML generation used by Mammoth |
| `readable-stream` | MIT | Stream support used by JSZip |
| `core-util-is` | MIT | Stream type utility |
| `inherits` | ISC | Stream inheritance utility |
| `isarray`, `process-nextick-args`, `safe-buffer`, `string_decoder`, `util-deprecate` | MIT | Stream compatibility utilities |
| `setimmediate` | MIT | JSZip scheduling utility |

Turndown declares `@mixmark-io/domino` (BSD-2-Clause) for Node.js DOM support. The browser-targeted bundle uses Obsidian's DOM and tree-shakes Domino from `main.js`.

Build and test dependencies are not included in the runtime ZIP except insofar as esbuild incorporates runtime dependencies into `main.js`. Their notices and license metadata remain available in `package-lock.json` and installed package directories during development.

The architecture and terminology were informed by Microsoft MarkItDown, licensed under the MIT License: Copyright (c) Microsoft Corporation. No Microsoft Python source files are distributed in this plugin.

Obsidian is a product of Dynalist Inc. The `obsidian` API package is a development-only dependency and is external at runtime.
