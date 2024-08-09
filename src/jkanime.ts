import puppeter from "puppeteer";

export const getM3U8FromJkanime = async (url: string): Promise <string> => {
  const browser = await puppeter.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  let m3u8Url: string  = '';

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes(".m3u8")) {
      m3u8Url = request.url();
      console.log(`Found m3u8 URL: ${m3u8Url}`);
    }
    request.continue();
  });

  try {
    await page.goto(url, { waitUntil: "networkidle0" } );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error(`Error navigating to ${url}:`, (error as Error).message);
  } finally {
    await browser.close();
  }

  return m3u8Url;
};



async function main() {
  const url = "https://jkanime.net/vinland-saga/1/";
  const m3u8 = await getM3U8FromJkanime(url);
  console.log(m3u8);
}

main();

