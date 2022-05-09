import * as path from 'path';
import { exit } from 'process';
import { Command } from 'commander';
import { ManganatoSource, ManganatoSourceData } from './sources/manganato';
import { JobFile } from './jobFile';
import { EPubRenderer } from './renderers/epubRenderer';
import { MangaSource } from './sources/source';
import { MangaseeSource, MangaseeSourceData } from './sources/mangasee';

const program = new Command();

program.name('Tankobon').description('A script to download Manga pages and bind them into an ePub.').version('1.0.0-alpha.3');

program.requiredOption('-m, --manga-stub <stub>', 'The Manganato URL stub for the manga series');
program.requiredOption('-c, --chapter-stubs <stubs...>', 'A list of chapter stubs to download');
program.requiredOption('-t, --title <title>', 'The title of the output ePub');
program.option('-o, --output <path>', 'The fully-resolved local path to write the output ePub');
program.option('-a, --author <author>', 'The author of the output ePub');
program.option('-i, --cover <path>', 'The fully-resolved local path to a cover image');
program.option('-s, --source <source>', 'The source of the manga images. Available options: manganato, mangasee', 'mangasee');

program.parse();

const options = program.opts();

if (!['mangasee', 'manganato'].includes(options.source as string)) {
  console.log("Please enter a valid source.");
  exit(1);
}

const job: JobFile = {
  title: options.title,
  author: options.author || 'Manga Author',
  coverPath: options.cover ? path.resolve(options.cover) : undefined,
  outputPath: options.output ? path.resolve(options.output) : '',
  source: {
    type: options.source,
    mangaStub: options.mangaStub,
    chapterStubs: options.chapterStubs,
  },
};

// const job: JobFile = {
//   title: "test",
//   author: "test",
//   coverPath: undefined,
//   outputPath: "/home/josh",
//   source: {
//     type: 'mangasee',
//     mangaStub: 'Spy-X-Family',
//     chapterStubs: ['chapter-1']
//   }
// }

const runJob = async () => {
  let source: MangaSource;

  switch (options.type) {
    case 'manganato':
      source = new ManganatoSource(job.source as ManganatoSourceData);
      break;
    case 'mangasee':
    default:
      source = new MangaseeSource(job.source as MangaseeSourceData);
  }

  const renderer = new EPubRenderer(job);

  await source.setup();
  await renderer.setup();

  console.log(`Downloading files with source ${options.source}...`);

  const chapterFiles = await source.fetch();

  console.log(`Writing ebook to ${job.outputPath || 'the current directory'}...`);

  await renderer.render(chapterFiles);

  console.log('Cleaning up temp directories...');

  await source.cleanup();
  await renderer.cleanup();
};

runJob().then(() => console.log('Done!'));
