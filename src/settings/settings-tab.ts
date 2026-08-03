import { PluginSettingTab, Setting, type App } from "obsidian";
import type MarkItDownImporterPlugin from "../main";

export class MarkItDownImporterSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: MarkItDownImporterPlugin) {
    super(app, plugin);
  }

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName("Default output folder").setDesc("Vault-relative folder for imported notes.").addText((text) => text
      .setPlaceholder("Imports").setValue(this.plugin.settings.defaultOutputFolder)
      .onChange(async (value) => { this.plugin.settings.defaultOutputFolder = value.trim() || "Imports"; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Create output folder automatically").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.createOutputFolderAutomatically)
      .onChange(async (value) => { this.plugin.settings.createOutputFolderAutomatically = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("RTL correction").setDesc("Conservatively repair likely visually ordered Persian and Arabic text.").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.rtlCorrectionEnabled)
      .onChange(async (value) => { this.plugin.settings.rtlCorrectionEnabled = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("RTL Markdown formatting").addDropdown((dropdown) => dropdown
      .addOptions({ plain: "Plain logical Unicode", html: "HTML RTL blocks", automatic: "Automatic" })
      .setValue(this.plugin.settings.rtlFormattingMode)
      .onChange(async (value) => { this.plugin.settings.rtlFormattingMode = value as typeof this.plugin.settings.rtlFormattingMode; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Open note after import").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.openNoteAfterImport)
      .onChange(async (value) => { this.plugin.settings.openNoteAfterImport = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Existing-file behavior").addDropdown((dropdown) => dropdown
      .addOptions({ ask: "Ask", unique: "Create a unique filename", overwrite: "Overwrite" })
      .setValue(this.plugin.settings.existingFileBehavior)
      .onChange(async (value) => { this.plugin.settings.existingFileBehavior = value as typeof this.plugin.settings.existingFileBehavior; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Include source metadata").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.includeSourceMetadata)
      .onChange(async (value) => { this.plugin.settings.includeSourceMetadata = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Include import timestamp").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.includeImportTimestamp)
      .onChange(async (value) => { this.plugin.settings.includeImportTimestamp = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Add full source path to front matter").setDesc("Disabled by default to avoid exposing private filesystem paths.").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.addSourcePathToFrontMatter)
      .onChange(async (value) => { this.plugin.settings.addSourcePathToFrontMatter = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("PDF page separators").addDropdown((dropdown) => dropdown
      .addOptions({ none: "None", comments: "HTML comments", headings: "Markdown headings" })
      .setValue(this.plugin.settings.pdfPageSeparators)
      .onChange(async (value) => { this.plugin.settings.pdfPageSeparators = value as typeof this.plugin.settings.pdfPageSeparators; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Offline OCR for scanned PDFs").setDesc("Automatically use bundled Persian, Arabic, and English OCR when a PDF has no extractable text.").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.ocrScannedPdfFallback)
      .onChange(async (value) => { this.plugin.settings.ocrScannedPdfFallback = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Debug logging").setDesc("Write detailed errors to the developer console. Document content is never logged.").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.debugLogging)
      .onChange(async (value) => { this.plugin.settings.debugLogging = value; await this.plugin.saveSettings(); }));
  }
}
