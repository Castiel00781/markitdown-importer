export class Logger {
  constructor(private readonly debugEnabled: () => boolean) {}

  debug(message: string, error?: unknown): void {
    if (this.debugEnabled()) console.debug(`[MarkItDown Importer] ${message}`, error ?? "");
  }
}
