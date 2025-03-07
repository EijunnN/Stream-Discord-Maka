// import puppeter from "puppeteer";

// export const getM3U8FromJkanime = async (url: string): Promise<string> => {
//   const proxyURL = 'gw.dataimpulse.com:823';
//   const username = '661e9d1fda89d1e94039';
//   const password = 'ed8934de4aebeb2c';
//   const browser = await puppeter.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox", `--proxy-server=${proxyURL}`,]
//     ,
//   });
//   console.log("Creating new page...");
//   const page = await browser.newPage();
// await page.authenticate({
//   username,
//   password,
// });
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


import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const getM3U8FromJkanime = async (url: string): Promise<string> => {
  const proxyURL = 'gw.dataimpulse.com:823';
  const username = '661e9d1fda89d1e94039';
  const password = 'ed8934de4aebeb2c';
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      `--proxy-server=${proxyURL}`,
    ],
  });

  const page = await browser.newPage();
  await page.authenticate({
    username,
    password,
  });
  await page.setViewport({
    width: 1920,
    height: 1080,
  });

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
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("Navigation complete");
    
    

    // Extraer contenido de la página si es necesario
    const pageContent = await page.content();
    console.log("Page content length:", pageContent.length);

    // Esperar un poco más por si hay cargas dinámicas adicionales
    // await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error(`Error navigating to ${url}:`, (error as Error).message);
  } finally {
    await browser.close();
  }

  return m3u8Url;
};

