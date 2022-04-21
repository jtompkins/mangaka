#! /usr/bin/env node
(() => {
    const defines = {};
    const entry = [null];
    function define(name, dependencies, factory) {
        defines[name] = { dependencies, factory };
        entry[0] = name;
    }
    define("require", ["exports"], (exports) => {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: (name) => resolve(name) });
    });
    var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    });
    var __importStar = (this && this.__importStar) || function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
    var __importDefault = (this && this.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    define("sources/source", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
    });
    define("sources/manganato", ["require", "exports", "fs/promises", "path", "os", "puppeteer-extra", "puppeteer-extra-plugin-stealth"], function (require, exports, promises_1, path, os, puppeteer_extra_1, puppeteer_extra_plugin_stealth_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.ManganatoSource = void 0;
        path = __importStar(path);
        os = __importStar(os);
        puppeteer_extra_1 = __importDefault(puppeteer_extra_1);
        puppeteer_extra_plugin_stealth_1 = __importDefault(puppeteer_extra_plugin_stealth_1);
        puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
        class ManganatoSource {
            tmpRoot;
            mangaStub;
            chapterStubs;
            constructor(sourceData) {
                this.tmpRoot = path.join(os.tmpdir(), `mangafiles-${sourceData.mangaStub}`);
                this.mangaStub = sourceData.mangaStub;
                this.chapterStubs = sourceData.chapterStubs;
            }
            async setup() {
                try {
                    console.log('Creating temp directory at ', this.tmpRoot);
                    await (0, promises_1.mkdir)(this.tmpRoot);
                    return true;
                }
                catch {
                    return false;
                }
            }
            async fetch() {
                const browser = await puppeteer_extra_1.default.launch();
                const page = await browser.newPage();
                await page.setViewport({ width: 2560, height: 1440 });
                let chapters = new Array();
                for (const chapterStub of this.chapterStubs) {
                    const chapterUrl = `https://readmanganato.com/manga-${this.mangaStub}/${chapterStub}`;
                    const imageSelector = `img[src*="${this.mangaStub}"]`;
                    let chapterFiles = [];
                    await page.goto(chapterUrl);
                    await page.waitForSelector(imageSelector);
                    const pageImages = await page.$$(imageSelector);
                    for (const img of pageImages) {
                        const src = await img.evaluate(imgNode => imgNode.getAttribute('src'));
                        const imgName = src?.split('/').at(-1)?.split('.')[0];
                        const imgIndex = Number.parseInt(imgName?.split('-')[0]);
                        const imgPath = path.join(this.tmpRoot, `${chapterStub}-${imgIndex}.png`);
                        try {
                            console.log('Downloading image ', src);
                            await img.screenshot({ path: imgPath });
                            chapterFiles[imgIndex] = imgPath;
                        }
                        catch (err) {
                            console.log('Download failed', src, err);
                        }
                    }
                    chapters.push(chapterFiles);
                }
                await browser.close();
                return chapters;
            }
            async cleanup() {
                try {
                    await (0, promises_1.rm)(this.tmpRoot, { recursive: true });
                    return true;
                }
                catch {
                    return false;
                }
            }
        }
        exports.ManganatoSource = ManganatoSource;
    });
    define("jobFile", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
    });
    define("renderers/renderer", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
    });
    define("renderers/epubRenderer", ["require", "exports", "fs/promises", "url", "path", "epub-gen"], function (require, exports, promises_2, url_1, path_1, epub_gen_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.EPubRenderer = void 0;
        epub_gen_1 = __importDefault(epub_gen_1);
        class EPubRenderer {
            outputPath;
            title;
            author;
            coverPath;
            constructor(jobFile) {
                this.outputPath = jobFile.outputPath;
                this.title = jobFile.title;
                this.author = jobFile.author;
                this.coverPath = jobFile.coverPath;
            }
            async setup() {
                try {
                    await (0, promises_2.mkdir)(this.outputPath, { recursive: true });
                    return true;
                }
                catch {
                    return false;
                }
            }
            async render(files) {
                const chapters = files.map(fileList => {
                    return {
                        data: fileList.map(f => `<p><img src="${(0, url_1.pathToFileURL)(f)}" /></p>`).join('\n'),
                    };
                });
                const epubOptions = {
                    output: (0, path_1.join)(this.outputPath, `${this.title}.epub`),
                    customOpfTemplatePath: (0, path_1.join)(__dirname, 'content.opf.ejs'),
                    title: this.title,
                    author: this.author,
                    content: chapters,
                    cover: this.coverPath || undefined,
                };
                try {
                    await new epub_gen_1.default(epubOptions).promise;
                    return true;
                }
                catch {
                    return false;
                }
            }
            async cleanup() {
                return true;
            }
        }
        exports.EPubRenderer = EPubRenderer;
    });
    define("index", ["require", "exports", "path", "commander", "sources/manganato", "renderers/epubRenderer"], function (require, exports, path, commander_1, manganato_1, epubRenderer_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        path = __importStar(path);
        const program = new commander_1.Command();
        program.name('Tankobon').description('A script to download Manga pages and bind them into an ePub.').version('0.1');
        program.requiredOption('-m, --manga-stub <stub>', 'The Manganato URL stub for the manga series');
        program.requiredOption('-s, --chapter-stubs <stubs...>', 'A list of chapter stubs to download');
        program.requiredOption('-t, --title <title>', 'The title of the output ePub');
        program.option('-o, --output <path>', 'The fully-resolved local path to write the output ePub');
        program.option('-a, --author <author>', 'The author of the output ePub');
        program.option('-c, --cover <path>', 'The fully-resolved local path to a cover image');
        program.parse();
        const options = program.opts();
        const job = {
            title: options.title,
            author: options.author || 'Manga Author',
            coverPath: options.cover ? path.resolve(options.cover) : undefined,
            outputPath: options.output ? path.resolve(options.output) : '',
            source: {
                type: 'manganato',
                mangaStub: options.mangaStub,
                chapterStubs: options.chapterStubs,
            },
        };
        const runJob = async () => {
            const source = new manganato_1.ManganatoSource(job.source);
            const renderer = new epubRenderer_1.EPubRenderer(job);
            await source.setup();
            await renderer.setup();
            console.log('Downloading files...');
            const chapterFiles = await source.fetch();
            console.log('Writing ebook to', job.outputPath || '.');
            await renderer.render(chapterFiles);
            console.log('Cleaning up temp directories...');
            await source.cleanup();
            await renderer.cleanup();
        };
        runJob().then(() => console.log('Done!'));
    });
    //# sourceMappingURL=index.js.map
    'marker:resolver';

    function get_define(name) {
        if (defines[name]) {
            return defines[name];
        }
        else if (defines[name + '/index']) {
            return defines[name + '/index'];
        }
        else {
            const dependencies = ['exports'];
            const factory = (exports) => {
                try {
                    Object.defineProperty(exports, "__cjsModule", { value: true });
                    Object.defineProperty(exports, "default", { value: require(name) });
                }
                catch {
                    throw Error(['module "', name, '" not found.'].join(''));
                }
            };
            return { dependencies, factory };
        }
    }
    const instances = {};
    function resolve(name) {
        if (instances[name]) {
            return instances[name];
        }
        if (name === 'exports') {
            return {};
        }
        const define = get_define(name);
        instances[name] = {};
        const dependencies = define.dependencies.map(name => resolve(name));
        define.factory(...dependencies);
        const exports = dependencies[define.dependencies.indexOf('exports')];
        instances[name] = (exports['__cjsModule']) ? exports.default : exports;
        return instances[name];
    }
    if (entry[0] !== null) {
        return resolve(entry[0]);
    }
})();