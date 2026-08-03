import { ImportError } from "../utils/errors";

interface ElectronFile extends File { path?: string }
interface ElectronModule { webUtils?: { getPathForFile(file: File): string } }

export interface SelectedInputFile {
  absolutePath: string;
  name: string;
  data: ArrayBuffer;
}

function absolutePath(file: ElectronFile): string {
  if (file.path) return file.path;
  try {
    const electron = window.require?.("electron") as ElectronModule | undefined;
    return electron?.webUtils?.getPathForFile(file) ?? "";
  } catch {
    return "";
  }
}

export class FilePicker {
  async pick(): Promise<SelectedInputFile | null> {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.docx,.html,.htm,.txt,.md,.csv";
      input.addClass("markitdown-importer-hidden-input");
      const cleanup = (): void => input.remove();
      input.addEventListener("cancel", () => {
        cleanup();
        resolve(null);
      }, { once: true });
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          resolve(null);
          return;
        }
        const path = absolutePath(file);
        if (!path) {
          cleanup();
          reject(new ImportError("READ_FAILED", "Obsidian did not provide the selected file path."));
          return;
        }
        void file.arrayBuffer().then((data) => {
          cleanup();
          resolve({ absolutePath: path, name: file.name, data });
        }, (error: unknown) => {
          cleanup();
          reject(new ImportError("READ_FAILED", "The selected file could not be read.", { cause: error }));
        });
      }, { once: true });
      document.body.appendChild(input);
      input.click();
    });
  }
}
