interface JobFile {
  title: string;
  author: string;
  coverPath: string | undefined;
  source: unknown;
  outputPath: string;
}

export type { JobFile };
