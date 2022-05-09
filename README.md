# Tankobon

A simple script for downloading manga and converting it into ePub ebooks. Warning: this is not a polished application. Use at your own risk.

Additionally, don't download manga you don't own legally.

## Usage

You'll need a functional Node environment, including NPM. To install:

`npm install -g tankobon`

Invoke the script like this:

`tankobon -m <stub> -c <stub> -t <title>`

Alternatively, if you don't want to install the package, and you have Yarn installed, you can just clone the repo and run the script directly:

`yarn start -m <stub> -c <stub> -t <title>`

There are two supported manga sources: Mangasee and Manganato. If you don't specify a source, the script will use Mangasee. For either one, you'll need "stubs" for both the manga and chapter(s) you want to download. You can get those from the URL:

**Mangasee**

```
https://mangasee123.com/read-online/Spy-X-Family-chapter-56.html
                                    ^^^^^^^^^^^^ ^^^^^^^^^^
                                    Manga        Chapter
```

**Manganato**

```
https://readmanganato.com/manga-em981495/chapter-59
                                ^^^^^^^^ ^^^^^^^^^^
                                Manga    Chapter
```

The script can handle multiple chapter stubs at once. Full usage:

```
Usage: Tankobon [options]

A script to download Manga pages and bind them into an ePub.

Options:
  -V, --version                   output the version number
  -m, --manga-stub <stub>         The Manganato URL stub for the manga series
  -c, --chapter-stubs <stubs...>  A list of chapter stubs to download
  -t, --title <title>             The title of the output ePub
  -o, --output <path>             The fully-resolved local path to write the output ePub
  -a, --author <author>           The author of the output ePub
  -i, --cover <path>              The fully-resolved local path to a cover image
  -s, --source <source>           The source of the manga images. Available options: manganato, mangasee
  -h, --help                      display help for command
```

## Development

To build the project, run this command:

`yarn build`

You can run the project locally with `yarn start`; there is also a VS Code launch file provided that will start a debugger.
