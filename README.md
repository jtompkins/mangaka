# mangaka

A simple script for downloading manga and converting it into ePub ebooks. Warning: this is not a polished application.

## Usage

Right now, there is not a functional binary. You'll need a Node environment locally. You'll also need `yarn`.

Invoke the script like this:

`yarn start -m <stub> -c <stub> -t <title>`

The only supported manga source right now is Manganato. You'll need "stubs" for both the manga and chapter(s) you want to download. Get these from the URL:

```
https://readmanganato.com/manga-em981495/chapter-59
                                ^^^^^^^^ ^^^^^^^^^^
                                Manga    Chapter
```

The script can handle multiple chapter stubs at once. Full usage:

```
Usage: Mangaka [options]

A script to download Manga pages and bind them into an ePub

Options:
  -V, --version                   output the version number
  -m, --manga-stub <stub>         The Manganato URL stub for the manga series
  -s, --chapter-stubs <stubs...>  A list of chapter stubs to download
  -t, --title <title>             The title of the output ePub
  -o, --output <path>             The fully-resolved local path to write the output ePub
  -a, --author <author>           The author of the output ePub
  -c, --cover <path>              The fully-resolved local path to a cover image
  -h, --help                      display help for command
```
