import puppeter from "puppeteer";

export const getM3U8FromJkanime = async (url: string): Promise<string> => {
  const browser = await puppeter.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  console.log("Creating new page...");
  const page = await browser.newPage();
  console.log("New page created");
  let m3u8Url: string = "";

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
  console.log(url);
  const m3u8 = await getM3U8FromJkanime(url);
  console.log(m3u8);
}

main();
