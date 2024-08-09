// import puppeter from "puppeteer";

// export const getM3U8FromJkanime = async (url: string): Promise<string> => {
//   const browser = await puppeter.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });
//   console.log("Creating new page...");
//   const page = await browser.newPage();
//   console.log("New page created");
//   let m3u8Url: string = "";

//   await page.setRequestInterception(true);
//   page.on("request", (request) => {
//     if (request.url().includes(".m3u8")) {
//       m3u8Url = request.url();
//       console.log(`Found m3u8 URL: ${m3u8Url}`);
//     }
//     request.continue();
//   });

//   try {
//     console.log(`Navigating to ${url}...`);
//     await page.goto(url, { waitUntil: "networkidle0" });
//     let content = await page.content();
//     console.log(content,"xd");
//     console.log("Navigation complete");
//     await new Promise((resolve) => setTimeout(resolve, 10000));
//   } catch (error) {
//     console.error(`Error navigating to ${url}:`, (error as Error).message);
//   } finally {
//     await browser.close();
//   }

//   return m3u8Url;
// };

// async function main() {
//   const url = "https://jkanime.net/vinland-saga/1/";
//   console.log(url);
//   const m3u8 = await getM3U8FromJkanime(url);
//   console.log(m3u8);
// }

// main();


import puppeteer from "puppeteer";

export const getM3U8FromJkanime = async (url: string): Promise<string> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  let m3u8Url: string = '';

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes(".m3u8")) {
      m3u8Url = request.url();
      console.log(`Found m3u8 URL: ${m3u8Url}`);
    }
    request.continue();
  });

  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    console.log("Navigation complete");
    
    

    // // Esperar a que se cargue el contenido dinámico
    // await page.waitForSelector('#player', { timeout: 30000 }).catch(() => console.log('Player selector not found'));

    // Extraer contenido de la página si es necesario
    const pageContent = await page.content();
    console.log("Page content length:", pageContent.length);

    // Esperar un poco más por si hay cargas dinámicas adicionales
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error(`Error navigating to ${url}:`, (error as Error).message);
  } finally {
    await browser.close();
  }

  return m3u8Url;
};

async function main() {
  const url = "https://jkanime.net/vinland-saga/1/";
  console.log("Starting scraping process for URL:", url);
  const m3u8 = await getM3U8FromJkanime(url);
  console.log("Extracted m3u8 URL:", m3u8);
}

main();