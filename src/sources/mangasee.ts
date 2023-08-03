import { mkdir, access } from 'fs/promises';
import * as path from 'path';
import * as process from 'process';

import cliProgress from 'cli-progress';
import colors from 'ansi-colors';

import puppeteer from 'puppeteer-extra';

import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

import { JobFile } from '../jobFile';

const findChaptersToDownload = (chapters: Array<number>, job: JobFile) => {
  let startIndex = 0;
  let endIndex = chapters.length;

  if (job.first) {
    let first = chapters.indexOf(job.first);

    if (first !== -1) {
      startIndex = first;
    }
  }

  if (job.last) {
    let last = chapters.indexOf(job.last);

    if (last !== -1) {
      endIndex = !job.exclusive ? last + 1 : last;
    }
  }

  return chapters.slice(startIndex, endIndex);
};

const fetch = async (job: JobFile): Promise<void> => {
  const CWD = process.cwd();

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 2560, height: 1440 });

  // go to the manga page and find the real name of the manga
  const mangaUrl = `https://mangasee123.com/manga/${job.stub}`;

  await page.goto(mangaUrl);
  await page.waitForSelector('h1', { visible: true });

  const mangaTitle = await page.$eval('h1', el => el.innerText);
  const mangaPath = path.join(CWD, mangaTitle);

  await mkdir(mangaPath, { recursive: true });

  // detect chapters
  // first, we need to expand the list of chapters
  const expandChaptersElement = await page.$('.ShowAllChapters');

  if (expandChaptersElement) {
    await expandChaptersElement.click();
  }

  // now find all the chapter list items and capture their number and URLs
  let chapters = new Array<number>();

  const chapterLinks = await page.$$('a.ChapterLink');

  for (const chapter of chapterLinks) {
    const rawChapterName = await chapter.$eval('span', el => el.innerText);
    const chapterNumber = Number.parseFloat(rawChapterName!.split(' ')[1]);

    chapters.push(chapterNumber);
  }

  chapters.sort((a, b) => a - b);

  const chaptersToDownload = findChaptersToDownload(chapters, job);

  console.log(`Downloading ${chaptersToDownload.length} chapters of ${mangaTitle}...`);

  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} | {filename} | {value}/{total}',
    },
    cliProgress.Presets.shades_classic,
  );

  const chapterBar = multibar.create(chaptersToDownload.length, 0, { filename: 'N/A' });

  for (const chapter of chaptersToDownload) {
    chapterBar.update({ filename: `Chapter ${chapter}` });

    const chapterPath = path.join(mangaPath, `Chapter ${chapter}`);

    await mkdir(chapterPath, { recursive: true });

    const chapterUrl = `https://mangasee123.com/read-online/${job.stub}-chapter-${chapter}.html`;

    const imageSelector = `img[src*="${job.stub}"]`;

    await page.goto(chapterUrl);
    await page.waitForSelector(imageSelector, { visible: true });

    page.addStyleTag({ content: 'nav.navbar { visibility: hidden; }' });

    const pageImages = await page.$$(imageSelector);

    const pagesBar = multibar.create(pageImages.length, 0, { filename: 'N/A' });

    for (const img of pageImages) {
      const boundingBox = await img.boundingBox();

      if (!boundingBox) {
        pagesBar.increment();
        continue;
      }

      const src = await img.evaluate(imgNode => imgNode.getAttribute('src'));

      const imgName = src?.split('/').at(-1)?.split('.png')[0];
      const imgIndex = Number.parseInt(imgName?.split('-')[1] as string);
      const imgPath = path.join(chapterPath, `${imgIndex}.png`);

      pagesBar.update({ filename: `Page ${imgIndex}` });

      try {
        // console.log(`Downloading image from ${src} to ${imgPath}`);
        await img.screenshot({ path: imgPath });
        pagesBar.increment();
      } catch (err) {
        console.log('Download failed', src, err);
      }
    }

    pagesBar.update({ filename: `Chapter ${chapter}` });
    pagesBar.stop();
    chapterBar.increment();
  }

  multibar.stop();
  await browser.close();
};

export { fetch };
