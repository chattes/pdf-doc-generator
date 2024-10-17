const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const readline = require('readline');
const { URL } = require('url');

async function scrapeAndGeneratePDF(startUrl, outputPath, maxDepth = 5) {
    try {
        // Sanitize and validate the URL
        let baseUrl;
        try {
            baseUrl = new URL(startUrl);
        } catch (error) {
            console.error('Invalid URL provided. Please enter a valid URL.');
            process.exit(1);
        }

        // Launch Puppeteer browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Set to store visited links
        const visitedLinks = new Set();
        let linkCount = 0;
        
        // Create a new PDF document
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(outputPath)); // Save PDF to specified path

        // Function to scrape a single link
        async function scrapeLink(link, depth) {
            if (visitedLinks.has(link) || depth > maxDepth) return; // Skip if already visited or depth exceeded
            visitedLinks.add(link); // Mark link as visited
            linkCount++;
            console.log(`Processing link #${linkCount}: ${link}`);
            
            try {
                const linkUrl = new URL(link);
                // Skip links that are not part of the base domain
                if (linkUrl.origin !== baseUrl.origin) {
                    console.log(`Skipping link #${linkCount} as it is outside the base domain: ${link}`);
                    return;
                }

                await page.goto(link, { waitUntil: 'networkidle2' });
                const content = await page.evaluate(() => {
                    return document.body ? document.body.innerText : 'Content not found'; // Get text from the body
                });
                doc.addPage();
                doc.fontSize(12).text(content); // Add content to PDF as it's scraped

                // Extract links from the current page
                const links = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a')).map(link => link.href);
                });

                // Recursively scrape the links found on the page
                for (const newLink of links) {
                    await scrapeLink(newLink, depth + 1);
                }
            } catch (error) {
                console.error(`Error processing link #${linkCount}: ${link} - ${error.message}`);
            }
        }

        // Start scraping from the initial URL
        await scrapeLink(startUrl, 0);

        // Close the browser
        await browser.close();
        
        // Finalize the PDF and end the stream
        doc.end();
        
        console.log(`PDF generated successfully at ${outputPath}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Prompt for URL
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please enter the URL to scrape: ', (url) => {
    const outputPath = 'output.pdf'; // Desired output PDF file path
    scrapeAndGeneratePDF(url, outputPath);
    rl.close();
});

