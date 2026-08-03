import { Modal, Notice, Setting, type App, type ButtonComponent } from "obsidian";
import type { ExistingFileBehavior } from "../settings/settings-types";
import type { RtlCorrectionMode, RtlFormattingMode } from "../types/conversion";
import { userMessage } from "../utils/errors";
import { sanitizeFilename } from "../vault/filename-sanitizer";
import type { ConflictDecision } from "../vault/note-writer";
import { FilePicker, type SelectedInputFile } from "../services/file-picker";
import type { ImportService } from "../services/import-service";
import type MarkItDownImporterPlugin from "../main";
import { ProgressStatus } from "./progress-modal";
import { ResultModal } from "./result-modal";

class ConflictModal extends Modal {
  private settled = false;

  constructor(app: App, private readonly path: string, private readonly resolve: (decision: ConflictDecision) => void) {
    super(app);
  }
  override onOpen(): void {
    this.setTitle("Note already exists");
    this.contentEl.createEl("p", { text: `A note already exists at ${this.path}.` });
    new Setting(this.contentEl)
      .addButton((button) => button.setButtonText("Cancel").onClick(() => this.finish("cancel")))
      .addButton((button) => button.setButtonText("Create unique").onClick(() => this.finish("unique")))
      .addButton((button) => button.setButtonText("Overwrite").setWarning().onClick(() => this.finish("overwrite")));
  }
  private finish(decision: ConflictDecision): void {
    if (this.settled) return;
    this.settled = true;
    this.resolve(decision);
    this.close();
  }
  override onClose(): void {
    if (!this.settled) this.resolve("cancel");
    this.contentEl.empty();
  }
}

export class ImportModal extends Modal {
  private inputFile: SelectedInputFile | null = null;
  private outputFolder: string;
  private outputFilename = "";
  private rtlCorrection: RtlCorrectionMode;
  private rtlFormatting: RtlFormattingMode;
  private openAfterImport: boolean;
  private existingBehavior: ExistingFileBehavior;
  private controller: AbortController | null = null;
  private convertButton: ButtonComponent | null = null;
  private cancelButton: ButtonComponent | null = null;
  private progress: ProgressStatus | null = null;
  private pathInput: HTMLInputElement | null = null;
  private filenameInput: HTMLInputElement | null = null;

  constructor(app: App, plugin: MarkItDownImporterPlugin, private readonly importService: ImportService) {
    super(app);
    this.outputFolder = plugin.settings.defaultOutputFolder;
    this.rtlCorrection = plugin.settings.rtlCorrectionEnabled ? "automatic" : "disabled";
    this.rtlFormatting = plugin.settings.rtlFormattingMode;
    this.openAfterImport = plugin.settings.openNoteAfterImport;
    this.existingBehavior = plugin.settings.existingFileBehavior;
  }

  override onOpen(): void {
    this.modalEl.addClass("markitdown-importer-modal");
    this.setTitle("Import document as Markdown");
    this.contentEl.createEl("p", { cls: "setting-item-description", text: "Convert a local document entirely on this device and save it in the current Vault." });
    const inputSetting = new Setting(this.contentEl).setName("Input file").setDesc("PDF, DOCX, HTML, HTM, TXT, MD, or CSV");
    inputSetting.addText((text) => {
      text.setPlaceholder("Choose a document...");
      text.inputEl.readOnly = true;
      text.inputEl.setAttr("aria-label", "Selected input file path");
      this.pathInput = text.inputEl;
    });
    inputSetting.addButton((button) => button.setButtonText("Browse").setIcon("folder-open").onClick(() => void this.browse()));
    new Setting(this.contentEl).setName("Output Vault folder").addText((text) => text.setValue(this.outputFolder).onChange((value) => { this.outputFolder = value; }));
    new Setting(this.contentEl).setName("Output filename").addText((text) => {
      this.filenameInput = text.inputEl;
      text.setPlaceholder("Document.md").onChange((value) => { this.outputFilename = value; });
      text.inputEl.addEventListener("blur", () => {
        if (this.outputFilename) {
          this.outputFilename = sanitizeFilename(this.outputFilename);
          text.setValue(this.outputFilename);
        }
      });
    });
    new Setting(this.contentEl).setName("RTL correction mode").addDropdown((dropdown) => dropdown
      .addOptions({ automatic: "Automatic", disabled: "Disabled" }).setValue(this.rtlCorrection)
      .onChange((value) => { this.rtlCorrection = value as RtlCorrectionMode; }));
    new Setting(this.contentEl).setName("RTL Markdown formatting").addDropdown((dropdown) => dropdown
      .addOptions({ plain: "Plain logical Unicode", html: "HTML RTL blocks", automatic: "Automatic" }).setValue(this.rtlFormatting)
      .onChange((value) => { this.rtlFormatting = value as RtlFormattingMode; }));
    new Setting(this.contentEl).setName("Open generated note").addToggle((toggle) => toggle.setValue(this.openAfterImport).onChange((value) => { this.openAfterImport = value; }));
    new Setting(this.contentEl).setName("If note exists").addDropdown((dropdown) => dropdown
      .addOptions({ ask: "Ask", unique: "Create a unique filename", overwrite: "Overwrite" }).setValue(this.existingBehavior)
      .onChange((value) => { this.existingBehavior = value as ExistingFileBehavior; }));
    this.progress = new ProgressStatus(this.contentEl);
    new Setting(this.contentEl)
      .addButton((button) => {
        this.cancelButton = button;
        button.setButtonText("Cancel").onClick(() => {
          if (this.controller) this.controller.abort();
          else this.close();
        });
      })
      .addButton((button) => {
        this.convertButton = button;
        button.setButtonText("Convert").setCta().onClick(() => void this.convert());
      });
  }

  private async browse(): Promise<void> {
    try {
      const selected = await new FilePicker().pick();
      if (!selected) return;
      this.inputFile = selected;
      this.pathInput?.setAttr("value", selected.absolutePath);
      if (this.pathInput) this.pathInput.value = selected.absolutePath;
      this.outputFilename = sanitizeFilename(selected.name.replace(/\.[^.]+$/u, ""));
      if (this.filenameInput) this.filenameInput.value = this.outputFilename;
      this.progress?.ready("File selected. Ready to convert.");
    } catch (error) {
      new Notice(userMessage(error));
      this.progress?.ready(userMessage(error));
    }
  }

  private resolveConflict(path: string): Promise<ConflictDecision> {
    return new Promise((resolve) => new ConflictModal(this.app, path, resolve).open());
  }

  private async convert(): Promise<void> {
    if (!this.inputFile) {
      new Notice("Select an input file first.");
      return;
    }
    if (!this.outputFilename.trim()) {
      new Notice("Enter an output filename.");
      return;
    }
    this.controller = new AbortController();
    this.convertButton?.setDisabled(true);
    this.cancelButton?.setButtonText("Cancel import");
    try {
      const result = await this.importService.import({
        input: this.inputFile,
        outputFolder: this.outputFolder,
        outputFilename: sanitizeFilename(this.outputFilename),
        rtlCorrection: this.rtlCorrection,
        rtlFormatting: this.rtlFormatting,
        openAfterImport: this.openAfterImport,
        existingFileBehavior: this.existingBehavior,
      }, this.controller.signal, (status) => this.progress?.update(status), (path) => this.resolveConflict(path));
      new Notice(`Imported to ${result.file.path}`);
      this.close();
      new ResultModal(this.app, result.file.path, result.warnings).open();
    } catch (error) {
      const message = userMessage(error);
      new Notice(message);
      this.progress?.ready(message);
    } finally {
      this.controller = null;
      this.convertButton?.setDisabled(false);
      this.cancelButton?.setButtonText("Cancel");
    }
  }

  override onClose(): void {
    this.controller?.abort();
    this.contentEl.empty();
  }
}
