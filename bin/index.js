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
    var __importDefault = (this && this.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
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
    define("cloudflareBypass", ["require", "exports", "puppeteer-extra", "puppeteer-extra-plugin-stealth"], function (require, exports, puppeteer_extra_1, puppeteer_extra_plugin_stealth_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        puppeteer_extra_1 = __importDefault(puppeteer_extra_1);
        puppeteer_extra_plugin_stealth_1 = __importDefault(puppeteer_extra_plugin_stealth_1);
        // const puppeteer = require('puppeteer-extra');
        // const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
        const cloudflareBypass = async function (config) {
            const { url } = config;
            // Create the browser instance
            const browser = await puppeteer_extra_1.default.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: false,
            });
            // Create a new page instance
            const target = await browser.newPage();
            // Visit target url and read out the body
            await target.goto(url);
            const pageBody = await target.evaluate(() => document.querySelector('*').outerHTML);
            // Validate if we hit the cloudflare UAM page
            if (pageBody.includes('cf-im-under-attack')) {
                // Wait for the cf_clearance cookie
                const clearance = new Promise(resolve => {
                    target.on('request', async (request) => {
                        const { cookies } = await target._client.send('Network.getAllCookies');
                        let cf_clearance = cookies.findIndex(c => c.name === 'cf_clearance');
                        if (cf_clearance > -1) {
                            cf_clearance = cookies[cf_clearance];
                            resolve(cookies);
                        }
                    });
                });
                const taskCheck = new Promise(resolve => {
                    setTimeout(() => resolve(true), 10000);
                });
                // It should not take longer then 5 seconds to get the clearance cookie,
                // we create a Promise.race to give it a max timer of 10 seconds just to be sure
                let result = await Promise.race([clearance, taskCheck]);
                if (result && result.findIndex(c => c.name === 'cf_clearance')) {
                    result.useragent = await browser.userAgent();
                    await target.close();
                    await browser.close();
                    return result;
                }
                return false;
            }
            return false;
        };
        exports.default = cloudflareBypass;
    });
    define("sources/source", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
    });
    define("sources/manganato", ["require", "exports", "fs/promises", "path", "os", "puppeteer-extra", "puppeteer-extra-plugin-stealth"], function (require, exports, promises_1, path, os, puppeteer_extra_2, puppeteer_extra_plugin_stealth_2) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.ManganatoSource = void 0;
        path = __importStar(path);
        os = __importStar(os);
        puppeteer_extra_2 = __importDefault(puppeteer_extra_2);
        puppeteer_extra_plugin_stealth_2 = __importDefault(puppeteer_extra_plugin_stealth_2);
        puppeteer_extra_2.default.use((0, puppeteer_extra_plugin_stealth_2.default)());
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
                const browser = await puppeteer_extra_2.default.launch();
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
                // const __filename = fileURLToPath(import.meta.url);
                // const __dirname = dirname(__filename);
                const epubOptions = {
                    output: (0, path_1.join)(this.outputPath, `${this.title}.epub`),
                    customOpfTemplatePath: (0, path_1.join)(__dirname, '..', '..', 'templates', 'content.opf.ejs'),
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
        program.name('Mangaka').description('A script to download Manga pages and bind them into an ePub.').version('0.1');
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
            coverPath: options.cover,
            outputPath: path.resolve(options.output || '.'),
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
            console.log('Writing ebook to', job.outputPath);
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