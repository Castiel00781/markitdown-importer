import { setIcon } from "obsidian";
import type { ConversionProgress } from "../types/conversion";

export class ProgressStatus {
  private readonly textEl: HTMLElement;
  private readonly progressEl: HTMLProgressElement;

  constructor(container: HTMLElement) {
    const status = container.createDiv({ cls: "markitdown-importer-status", attr: { "aria-live": "polite" } });
    const icon = status.createSpan({ cls: "markitdown-importer-status-icon" });
    setIcon(icon, "loader-circle");
    this.textEl = status.createSpan({ text: "Ready to import." });
    this.progressEl = container.createEl("progress", { cls: "markitdown-importer-progress" });
    this.progressEl.max = 1;
    this.progressEl.value = 0;
  }

  update(progress: ConversionProgress): void {
    this.textEl.setText(progress.message);
    if (progress.current !== undefined && progress.total !== undefined) {
      this.progressEl.max = progress.total;
      this.progressEl.value = progress.current;
    } else {
      this.progressEl.removeAttribute("value");
    }
  }

  ready(message = "Ready to import."): void {
    this.textEl.setText(message);
    this.progressEl.max = 1;
    this.progressEl.value = 0;
  }
}
