const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function scrapeWebsite(url, depth = 1) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let content = '';

    async function scrape(currentUrl, currentDepth) {
        if (currentDepth > depth) return;

        await page.goto(currentUrl, { waitUntil: 'networkidle0' });
        content += await page.evaluate(() => document.body.innerText);
        content += '\n\n';

        const links = await page.evaluate(() => 
            Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href.startsWith('http'))
        );

        for (const link of links) {
            await scrape(link, currentDepth + 1);
        }
    }

    await scrape(url, 1);
    await browser.close();

    return content;
}

async function saveToPdf(content, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(`<pre>${content}</pre>`);
    await page.pdf({ path: outputPath, format: 'A4' });
    await browser.close();
}

async function main() {
    const url = process.argv[2];
    const outputPath = process.argv[3] || 'output.pdf';

    if (!url) {
        console.error('Please provide a URL as an argument');
        process.exit(1);
    }

    console.log(`Scraping ${url}...`);
    const content = await scrapeWebsite(url);
    console.log('Saving content to PDF...');
    await saveToPdf(content, outputPath);
    console.log(`PDF saved to ${outputPath}`);
}

main().catch(console.error);
