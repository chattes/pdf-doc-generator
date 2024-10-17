# Web Scraper and PDF Generator

This project contains a web scraper that crawls a website and generates a PDF of the content.

## Features

- Scrapes web pages starting from a given URL
- Follows links within the same domain
- Generates a PDF containing the scraped content
- Configurable maximum depth for crawling

## Usage

To use the web scraper, run the following command:

```
node webscraper.js <start_url> <output_path> [max_depth]
```

- `<start_url>`: The URL to start scraping from
- `<output_path>`: The path where the generated PDF will be saved
- `[max_depth]`: (Optional) The maximum depth for crawling links (default is 5)

## Requirements

- Node.js
- NPM packages (listed in package.json)

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run the scraper using the usage instructions above

## Note

Please be respectful of websites' `robots.txt` files and terms of service when using this scraper.
