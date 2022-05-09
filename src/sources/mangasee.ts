import { mkdir, rm } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

import { MangaSource } from './source';

export interface MangaseeSourceData {
  type: 'mangasee';
  mangaStub: string;
  chapterStubs: string[];
}

export class MangaseeSource implements MangaSource {
  tmpRoot: string;
  mangaStub: string;
  chapterStubs: string[];

  constructor(sourceData: MangaseeSourceData) {
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
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 2560, height: 1440 });

    let chapters = new Array<Array<string>>();

    for (const chapterStub of this.chapterStubs) {
      const chapterUrl = `https://mangasee123.com/read-online/${this.mangaStub}-${chapterStub}.html`;
      const imageSelector = `img[src*="${this.mangaStub}"]`;
      let chapterFiles: Array<string> = [];

      await page.goto(chapterUrl);
      await page.waitForSelector(imageSelector, { visible: true });

      page.addStyleTag({ content: "nav.navbar { visibility: hidden; }" });

      const pageImages = await page.$$(imageSelector);

      console.log(`Found ${pageImages.length} images. Downloading...`)

      for (const img of pageImages) {
        const boundingBox = await img.boundingBox();

        if (!boundingBox) {
          continue;
        }

        const src = await img.evaluate(imgNode => imgNode.getAttribute('src'));

        const imgName = src?.split('/').at(-1)?.split('.')[0];
        const imgIndex = Number.parseInt(imgName?.split('-')[1] as string);
        const imgPath = path.join(this.tmpRoot, `${chapterStub}-${imgIndex}.png`);

        try {
          console.log(`Downloading image from ${src} to ${imgPath}`);
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
