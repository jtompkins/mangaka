import { mkdir } from 'fs/promises';
import { pathToFileURL } from 'url';
import { join } from 'path';

import Epub from 'epub-gen';

import { Renderer } from './renderer';
import { JobFile } from '../jobFile';

export class EPubRenderer implements Renderer {
  outputPath: string;
  title: string;
  author: string;
  coverPath: string | undefined;

  constructor(jobFile: JobFile) {
    this.outputPath = jobFile.outputPath;
    this.title = jobFile.title;
    this.author = jobFile.author;
    this.coverPath = jobFile.coverPath;
  }

  async setup(): Promise<boolean> {
    try {
      await mkdir(this.outputPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  async render(files: Array<Array<string>>): Promise<boolean> {
    const chapters = files.map(fileList => {
      return {
        data: fileList.map(f => `<p><img src="${pathToFileURL(f)}" /></p>`).join('\n'),
      };
    });

    const epubOptions = {
      output: join(this.outputPath, `${this.title}.epub`),
      customOpfTemplatePath: join(__dirname, '..', '..', 'templates', 'content.opf.ejs'),
      title: this.title,
      author: this.author,
      content: chapters,
      cover: this.coverPath || undefined,
    };

    try {
      await new Epub(epubOptions).promise;
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<boolean> {
    return true;
  }
}
