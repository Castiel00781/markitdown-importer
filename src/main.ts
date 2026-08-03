import { Plugin } from "obsidian";
import { ImportModal } from "./modals/import-modal";
import { DEFAULT_SETTINGS, type MarkItDownImporterSettings } from "./settings/settings-types";
import { MarkItDownImporterSettingTab } from "./settings/settings-tab";
import { ImportService } from "./services/import-service";
import { Logger } from "./services/logger";
import { ensureEmbeddedOcrAssets } from "./services/ocr-assets";

export default class MarkItDownImporterPlugin extends Plugin {
  override settings: MarkItDownImporterSettings = { ...DEFAULT_SETTINGS };
  private logger!: Logger;

  override async onload(): Promise<void> {
    await this.loadSettings();
    this.logger = new Logger(() => this.settings.debugLogging);
    this.addCommand({ id: "import-document-as-markdown", name: "Import document as Markdown", callback: () => this.openImporter() });
    this.addRibbonIcon("file-input", "Import document as Markdown", () => this.openImporter());
    this.addSettingTab(new MarkItDownImporterSettingTab(this.app, this));
  }

  private openImporter(): void {
    const pluginDirectory = this.manifest.dir ?? `.obsidian/plugins/${this.manifest.id}`;
    const ensureOcrAssets = (signal: AbortSignal) => ensureEmbeddedOcrAssets(this.app.vault.adapter, pluginDirectory, signal);
    new ImportModal(this.app, this, new ImportService(this.app, this.settings, this.logger, ensureOcrAssets)).open();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MarkItDownImporterSettings> | null);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
