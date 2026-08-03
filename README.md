# MarkItDown Importer

[![CI](https://github.com/Castiel00781/markitdown-importer/actions/workflows/ci.yml/badge.svg)](https://github.com/Castiel00781/markitdown-importer/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Castiel00781/markitdown-importer)](https://github.com/Castiel00781/markitdown-importer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

MarkItDown Importer is an independent community plugin inspired by and based on concepts from Microsoft MarkItDown and the MarkItDown Desktop fork.

It is not an official Microsoft or Obsidian product and is not affiliated with or endorsed by Microsoft or Dynalist Inc. This project has not been accepted into the Obsidian community plugin catalog.

## Features

- Native desktop import modal and ribbon command
- Local PDF conversion with position-aware line reconstruction
- Automatic offline OCR fallback for scanned PDFs in Persian, Arabic, and English
- DOCX conversion with headings, lists, links, tables, and basic formatting where available
- Sanitized HTML/HTM conversion
- UTF-8 TXT and Markdown import
- CSV-to-Markdown table conversion
- Persian and Arabic Unicode normalization
- Confidence-based repair of likely reversed RTL PDF extraction
- Reverse-equivalent duplicate-line detection
- Ask, unique-name, and overwrite conflict modes
- Vault API output, optional front matter, progress, and cancellation

All conversion and OCR run locally in Obsidian Desktop. The plugin does not execute Python, shell commands, external programs, local servers, or remote conversion APIs.

## Supported Formats

Version 0.1.0 supports PDF, DOCX, HTML, HTM, TXT, MD, and CSV. PPTX and XLSX are planned. YouTube transcript support is under evaluation and is not included.

## Persian And Arabic

PDF text items are grouped by vertical position and reconstructed using coordinates rather than trusting extraction-array order. Correction preserves logical Unicode, Persian half-spaces, protected Latin tokens, URLs, email addresses, numbers, dates, and semantic versions. Low-confidence lines remain unchanged and produce warnings. RTL wrappers are optional and are independent of text-order correction.

RTL correction is experimental for complex layouts and PDFs with custom font encodings.

## Manual Installation

1. Download `markitdown-importer-<version>.zip` from the [latest GitHub release](https://github.com/Castiel00781/markitdown-importer/releases/latest).
2. Close Obsidian or disable the plugin, then extract the packaged `markitdown-importer` folder into `<Vault>/.obsidian/plugins/`.
3. Confirm `<Vault>/.obsidian/plugins/markitdown-importer/main.js`, `manifest.json`, and `styles.css` exist.
4. Open Obsidian and go to **Settings > Community plugins**.
5. Refresh or reload plugins and enable **MarkItDown Importer**.
6. Run **Import document as Markdown** from the Command Palette.

## Build

Requires a current Node.js LTS release and npm.

```sh
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run package:test
```

`npm run build` creates a self-contained `main.js` with compressed OCR worker, WebAssembly, and language resources. On first OCR use, the plugin extracts those resources locally into its own plugin directory. `npm run package:test` creates `markitdown-importer-<version>-test.zip`; `npm run package:release` creates the release ZIP. Both contain only `main.js`, `manifest.json`, and `styles.css`.

## Install With BRAT

BRAT 1.1.0 or newer can install the plugin directly from GitHub releases:

1. Install and enable **BRAT** in Obsidian.
2. Run **BRAT: Add a beta plugin for testing** from the Command Palette.
3. Enter `Castiel00781/markitdown-importer` or `https://github.com/Castiel00781/markitdown-importer`.
4. Select the latest release and enable **MarkItDown Importer**.

BRAT downloads the release's `main.js`, `manifest.json`, and `styles.css`. The release tag, release name, package version, and manifest version use the same semantic version without a leading `v`.

If BRAT reports that `manifest.json` is missing, first open the release's direct `manifest.json` asset in the same network environment as Obsidian. BRAT uses that release asset rather than only the repository-root file, and its message can also indicate that `api.github.com` or `release-assets.githubusercontent.com` is blocked by DNS, a firewall, or a proxy. Use the exact repository identifier above and BRAT 1.1.0 or newer.

## Usage

Select the command or ribbon icon, browse for an external document, choose a Vault-relative output folder and filename, review RTL and conflict options, and select **Convert**. The original file is never modified.

## Settings

Settings cover the default folder, automatic folder creation, RTL correction and formatting, opening generated notes, existing-file behavior, source metadata, timestamps, private source-path inclusion, PDF page separators, automatic offline OCR, and debug logging.

## Privacy

Normal conversion and OCR make no network requests and upload no content. OCR worker, WebAssembly, and `fas`, `ara`, and `eng` trained data are bundled with the plugin. There is no telemetry, analytics, advertising, tracking, account authentication, or cookie extraction. Full source paths are excluded from notes by default.

## Known Limitations

- Desktop only
- OCR is limited to printed Persian, Arabic, and English text; handwriting and complex image layouts may be inaccurate
- OCR increases the installed plugin size and is slower than native PDF text extraction
- Password-protected PDFs are not supported
- PPTX and XLSX are not implemented
- YouTube transcript import is not included
- Complex multi-column PDF layouts can require additional reconstruction work
- RTL correction remains experimental for custom PDF font encodings

## Testing Status

Automated unit, lint, type, and build checks are provided. Runtime behavior must also be verified in an actual Obsidian Vault using `TESTING-CHECKLIST.md`.

## Attribution

The project reimplements conversion and RTL concepts informed by Microsoft MarkItDown (MIT) and the separate MarkItDown Desktop fork. It does not copy Python packages or execute the original application. See `THIRD_PARTY_NOTICES.md`.

## License

MIT. See `LICENSE`.
