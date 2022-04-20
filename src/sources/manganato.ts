import { mkdir, rm } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

import { MangaSource } from './source.js';

export interface ManganatoSourceData {
  type: 'manganato';
  mangaStub: string;
  chapterStubs: string[];
}

export class ManganatoSource implements MangaSource {
  tmpRoot: string;
  mangaStub: string;
  chapterStubs: string[];

  constructor(sourceData: ManganatoSourceData) {
    this.tmpRoot = path.join(os.tmpdir(), `mangafiles-${sourceData.mangaStub}`);
    this.mangaStub = sourceData.mangaStub;
    this.chapterStubs = sourceData.chapterStubs;
  }

  async setup(): Promise<boolean> {
    try {
      console.log('Creating temp directory at ', this.tmpRoot);
      await mkdir(this.tmpRoot);
      return true;
    } catch {
      return false;
    }
  }

  async fetch(): Promise<Array<Array<string>>> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 2560, height: 1440 });

    let chapters = new Array<Array<string>>();

    for (const chapterStub of this.chapterStubs) {
      const chapterUrl = `https://readmanganato.com/manga-${this.mangaStub}/${chapterStub}`;
      const imageSelector = `img[src*="${this.mangaStub}"]`;
      let chapterFiles: Array<string> = [];

      await page.goto(chapterUrl);
      await page.waitForSelector(imageSelector);

      const pageImages = await page.$$(imageSelector);

      for (const img of pageImages) {
        const src = await img.evaluate(imgNode => imgNode.getAttribute('src'));

        const imgName = src?.split('/').at(-1)?.split('.')[0];
        const imgIndex = Number.parseInt(imgName?.split('-')[0] as string);
        const imgPath = path.join(this.tmpRoot, `${chapterStub}-${imgIndex}.png`);

        try {
          console.log('Downloading image ', src);
          await img.screenshot({ path: imgPath });
          chapterFiles[imgIndex] = imgPath;
        } catch (err) {
          console.log('Download failed', src, err);
        }
      }

      chapters.push(chapterFiles);
    }

    await browser.close();

    return chapters;
  }

  async cleanup(): Promise<boolean> {
    try {
      await rm(this.tmpRoot, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
}
