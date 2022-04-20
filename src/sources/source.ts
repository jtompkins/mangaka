interface MangaSource {
  setup(): Promise<boolean>;
  fetch(): Promise<Array<string[]>>;
  cleanup(): Promise<boolean>;
}

export type { MangaSource };
