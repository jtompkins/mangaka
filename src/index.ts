import { exit } from 'process';
import { Command } from 'commander';
import { JobFile } from './jobFile';
import { MangaSource } from './sources/source';
import { fetch as mangaseeFetch } from './sources/mangasee';

const program = new Command();

program.name('Tankobon').description('A script to download Manga pages in a format friendly for KCC binding.').version('1.0.0-alpha.6');

program.requiredOption('-m, --manga-stub <stub>', 'The source URL stub for the manga series');
program.option('-f, --first <chapter>', 'The first chapter to download, inclusive');
program.option('-l, --last <chapter>', 'The last chapter to download, inclusive by default');
program.option('-e, --exclusive', 'Flag determining whether the last chapter dowload should be exclusive');
program.option('-s, --source <source>', 'The source of the manga images. Available options: manganato, mangasee', 'mangasee');

program.parse();

const options = program.opts();

if (!['mangasee'].includes(options.source as string)) {
  console.log("Please enter a valid source.");
  exit(1);
}

const job: JobFile = {
  stub: options.mangaStub,
  first: options.first ? Number.parseFloat(options.first) : undefined,
  last: options.last ? Number.parseFloat(options.last) : undefined,
  exclusive: options.exclusive ? true : false
};

const runJob = async () => {
  let source: MangaSource;

  switch (options.type) {
    case 'mangasee':
    default:
      source = mangaseeFetch;
  }

  await source(job);
};

runJob().then(() => console.log('Done!'));
