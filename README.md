# Tankobon

A simple script for downloading manga for binding by [Kindle Comic Converter](https://github.com/ciromattia/kcc). Warning: this is not a polished application. Use at your own risk.

Additionally, don't download manga you don't own legally.

## Usage

You'll need a functional Node environment, including NPM. To install:

`npm install -g tankobon`

Invoke the script like this:

`tankobon -m <stub>`

Alternatively, if you don't want to install the package, and you have Yarn installed, you can just clone the repo and run the script directly:

`npm start -- -m <stub>`

There is only one supported manga source (but PRs are welcome!): Mangasee. If you don't specify a source, the script will use Mangasee. For either one, you'll need "stubs" for both the manga and chapter(s) you want to download. You can get those from the URL:

**Mangasee**

```
https://mangasee123.com/read-online/Spy-X-Family-chapter-56.html
                                    ^^^^^^^^^^^^ ^^^^^^^^^^
                                    Manga        Chapter
```

Full usage:

```
Usage: Tankobon [options]

A script to download Manga pages in a format friendly for KCC binding.

Options:
  -V, --version            output the version number
  -m, --manga-stub <stub>  The source URL stub for the manga series
  -f, --first <chapter>    The first chapter to download, inclusive
  -l, --last <chapter>     The last chapter to download, inclusive by default
  -e, --exclusive          Flag determining whether the last chapter dowload
                           should be exclusive
  -s, --source <source>    The source of the manga images. Available options:
                           manganato, mangasee (default: "mangasee")
  -h, --help               display help for command
```

## Development

To build the project, run this command:

`npm run build`

You can run the project locally with `npm start`; there is also a VS Code launch file provided that will start a debugger.
