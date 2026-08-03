import { Modal, Setting, type App } from "obsidian";

export class ResultModal extends Modal {
  constructor(app: App, private readonly path: string, private readonly warnings: string[]) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle("Import complete");
    this.contentEl.createEl("p", { text: "The Markdown note was created at:" });
    this.contentEl.createEl("code", { text: this.path, cls: "markitdown-importer-result-path" });
    if (this.warnings.length > 0) {
      this.contentEl.createEl("h3", { text: "Warnings" });
      const list = this.contentEl.createEl("ul");
      this.warnings.forEach((warning) => list.createEl("li", { text: warning }));
    }
    new Setting(this.contentEl).addButton((button) => button.setButtonText("Close").setCta().onClick(() => this.close()));
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
