import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const cloudflareBypass = async function (config) {
    const { url } = config;
    // Create the browser instance
    const browser = await puppeteer.launch({
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
export default cloudflareBypass;
//# sourceMappingURL=cloudflareBypass.js.map