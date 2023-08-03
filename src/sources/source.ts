import { JobFile } from "../jobFile";

type MangaSource = (job: JobFile) => Promise<void>;

export type { MangaSource };
