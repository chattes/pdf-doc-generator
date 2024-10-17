const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function scrapeWebsite(url, depth = 5, maxPages = 100) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let content = '';
    let scrapedCount = 0;
    const visitedUrls = new Set();

    async function scrape(currentUrl, currentDepth) {
        if (currentDepth > depth || scrapedCount >= maxPages || visitedUrls.has(currentUrl)) return;

        visitedUrls.add(currentUrl);

        try {
            await page.goto(currentUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            content += await page.evaluate(() => document.body.innerText);
            content += '\n\n';
            scrapedCount++;
            console.log(`Scraped ${scrapedCount} page(s). Current depth: ${currentDepth}`);

            if (currentDepth < depth && scrapedCount < maxPages) {
                const links = await page.evaluate(() => 
                    Array.from(document.querySelectorAll('a'))
                        .map(a => a.href)
                        .filter(href => 
                            href.startsWith('http') && 
                            !href.match(/\.(jpg|jpeg|png|gif|bmp|svg|mp3|mp4|wav|avi|mov|wmv|flv|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)
                        )
                );

                for (const link of links) {
                    if (scrapedCount >= maxPages) break;
                    await scrape(link, currentDepth + 1);
                }
            }
        } catch (error) {
            console.error(`Error scraping ${currentUrl}:`, error.message);
        }
    }

    try {
        await scrape(url, 1);
    } finally {
        await browser.close();
    }

    return content;
}

async function saveToPdf(content, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
        await page.setContent(`<pre>${content}</pre>`, { timeout: 60000 }); // Increase timeout to 60 seconds
        await page.pdf({ path: outputPath, format: 'A4', timeout: 60000 }); // Increase timeout to 60 seconds
    } catch (error) {
        console.error('Error saving PDF:', error);
        throw error; // Re-throw the error to be caught in the main function
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        const url = await askQuestion('Enter the URL to scrape: ');
        const outputPath = await askQuestion('Enter the output PDF file name (default: output.pdf): ') || 'output.pdf';
        const maxPages = 100;

        console.log(`Scraping ${url}... (Max pages: ${maxPages})`);
        const content = await scrapeWebsite(url, 5, maxPages);
        console.log('Saving content to PDF...');
        await saveToPdf(content, outputPath);
        console.log(`PDF saved to ${outputPath}`);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        rl.close();
    }
}

main();
