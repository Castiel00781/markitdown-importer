# Manual Testing Checklist

Use synthetic or non-sensitive documents. Do not use private organizational files for testing.

## Installation

- [ ] Close Obsidian or disable the plugin.
- [ ] Extract the `markitdown-importer` folder into `<Vault>\.obsidian\plugins\`.
- [ ] Confirm `<Vault>\.obsidian\plugins\markitdown-importer\main.js` exists.
- [ ] Confirm `<Vault>\.obsidian\plugins\markitdown-importer\manifest.json` exists.
- [ ] Confirm `<Vault>\.obsidian\plugins\markitdown-importer\styles.css` exists.
- [ ] Open Obsidian.
- [ ] Go to **Settings > Community plugins**.
- [ ] Refresh or reload plugins.
- [ ] Enable **MarkItDown Importer**.
- [ ] Run **Import document as Markdown** from the Command Palette.

## Plugin Basics

- [ ] Plugin loads without an Obsidian developer-console error.
- [ ] Command appears in the Command Palette.
- [ ] Ribbon icon appears and opens the same modal.
- [ ] Modal supports keyboard navigation and visible focus.
- [ ] Plugin can be disabled and re-enabled.
- [ ] Settings persist after an Obsidian restart.

## Formats

- [ ] Text PDF imports readable page-ordered content.
- [ ] Persian PDF produces logical Unicode in correct reading order.
- [ ] Mixed Persian/English PDF preserves names, versions, URLs, and numbers.
- [ ] DOCX imports headings, paragraphs, lists, links, and basic tables.
- [ ] HTML imports content without scripts or event attributes.
- [ ] TXT imports UTF-8 text and line breaks.
- [ ] Markdown preserves YAML front matter and fenced code.
- [ ] CSV handles quoted commas, empty cells, and Persian text.
- [ ] Scanned Persian PDF automatically runs OCR and creates searchable text.
- [ ] Scanned Arabic PDF automatically runs OCR and creates searchable text.
- [ ] Scanned English PDF automatically runs OCR and creates searchable text.
- [ ] First OCR use creates the local `ocr\worker.min.js`, `ocr\core`, and `ocr\lang` runtime resources inside the plugin directory.
- [ ] Disabling offline OCR causes an image-only PDF to show the OCR-required warning.

## Vault Behavior

- [ ] Missing output folder is created when automatic creation is enabled.
- [ ] Missing output folder fails clearly when automatic creation is disabled.
- [ ] Existing-note **Ask** offers cancel, unique, and overwrite choices.
- [ ] Existing-note **Create unique** does not modify the existing note.
- [ ] Existing-note **Overwrite** changes only the chosen target note.
- [ ] Generated note opens when enabled and stays closed when disabled.
- [ ] Success notice and result modal show the Vault-relative path.
- [ ] Original input file remains unchanged.

## Appearance And Responsiveness

- [ ] Modal is readable in dark mode.
- [ ] Modal is readable in light mode.
- [ ] Modal remains usable with a compact window or community theme.
- [ ] Large PDF shows page progress and does not freeze the interface for long periods.
- [ ] Cancelling a long PDF restores controls and creates no partial note.
- [ ] OCR initialization and page recognition show progress and remain cancellable after worker initialization.

Record the Obsidian version, operating-system version, plugin console errors, and a sanitized description of any failing document. Never attach confidential source documents to a public issue.
