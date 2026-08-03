# Testing Guide

This guide is for testers without development experience.

## Install The Test Package

1. Close Obsidian, or disable **MarkItDown Importer** if an older test build is enabled.
2. Open the ZIP supplied by the developer.
3. Extract its `markitdown-importer` folder into `<Vault>\.obsidian\plugins\`.
4. Confirm this exact structure:

```text
<Vault>\.obsidian\plugins\markitdown-importer\main.js
<Vault>\.obsidian\plugins\markitdown-importer\manifest.json
<Vault>\.obsidian\plugins\markitdown-importer\styles.css
```

5. Open Obsidian.
6. Go to **Settings > Community plugins**.
7. Refresh or reload plugins.
8. Enable **MarkItDown Importer**.
9. Open the Command Palette and run **Import document as Markdown**.

## Safe Test Documents

Create small synthetic documents that contain no private information. Useful Persian text is:

```text
گزارش اولیه گزینه‌های ورود مینو فارس به حوزه دانش‌بنیان
نسخه MarkItDown 1.2.3 در تاریخ 2026-08-03
https://example.com user@example.com
```

Test PDF, DOCX, HTML, TXT, Markdown, and CSV separately. For the scanned-PDF check, print a short synthetic text page to an image and place only that image in a PDF.

## Expected Results

- Notes are written only under the selected Vault folder.
- Persian and Arabic text is stored as searchable logical Unicode, not presentation glyphs.
- English tokens, URLs, email addresses, dates, and versions remain readable.
- Plain RTL mode adds no HTML wrappers.
- HTML RTL mode may wrap natural-language RTL paragraphs but not code, YAML, URLs, or tables.
- Scanned PDFs automatically use bundled offline OCR when the setting is enabled.
- OCR supports printed Persian, Arabic, and English. It does not upload pages or download language data.
- The first OCR import extracts embedded resources into the plugin's local `ocr` directory. BRAT and manual packages still require only the standard three installation files.
- When OCR is disabled, scanned PDFs report that OCR is required.
- Source paths appear in front matter only if the private-path setting is explicitly enabled.

## Reporting Problems

Include the Obsidian version, Windows version, selected settings, source format, and the exact visible error. If debug logging is enabled, copy only relevant plugin messages after checking that they contain no sensitive information. Do not send private documents, cookies, proxy settings, or full source paths.

The build may pass automated checks without having been loaded in your Obsidian installation. Complete every applicable item in `TESTING-CHECKLIST.md` before approving a test release.
