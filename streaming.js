import cheerio from "cheerio";
import puppeteer from "puppeteer";

const urlMovie = "https://cuevana.biz/serie/259684/cowboy-cartel/temporada/1/episodio/1";

const fetchDataSerie = async (url) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const script = $("#__NEXT_DATA__");
    if (script.length) {
      const data = JSON.parse(script.html());
      return data.props.pageProps;
    } else {
      throw new Error("No se encontraron datos de __NEXT_DATA__");
    }
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return null;
  }
};

const fetchVideoUrl = async (url) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const script = $('script').filter((i, el) => $(el).html().includes('var url =')).first();
    const scriptContent = script.html();
    const urlMatch = scriptContent.match(/var url = '(.+?)'/);
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    console.error(`Error fetching video URL from ${url}:`, error.message);
    return null;
  }
};

const fetchM3U8Url = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let m3u8Url = null;

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes('.m3u8')) {
      m3u8Url = request.url();
    }
    request.continue();
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(5000); // Wait for 5 seconds to ensure all requests are captured
  } catch (error) {
    console.error(`Error navigating to ${url}:`, error.message);
  } finally {
    await browser.close();
  }

  return m3u8Url;
};

const getPriorityVideoUrl = (videos) => {
  const priority = ['filemoon', 'voesx', 'streamwish'];
  for (const lang of ['latino', 'english']) {
    if (videos[lang] && videos[lang].length > 0) {
      for (const prio of priority) {
        const video = videos[lang].find(v => v.cyberlocker === prio);
        if (video) return video.result;
      }
      return videos[lang][0].result; // If no priority match, return the first video
    }
  }
  return null;
};

const main = async () => {
  const serie = await fetchDataSerie(urlMovie);
  if (!serie || !serie.episode || !serie.episode.videos) {
    console.error("No se encontraron datos de video");
    return;
  }

  const videoUrl = getPriorityVideoUrl(serie.episode.videos);
  if (!videoUrl) {
    console.error("No se encontró URL de video");
    return;
  }

  const embeddedVideoUrl = await fetchVideoUrl(videoUrl);
  if (!embeddedVideoUrl) {
    console.error("No se encontró URL de video embebido");
    return;
  }

  const m3u8Url = await fetchM3U8Url(embeddedVideoUrl);
  if (!m3u8Url) {
    console.error("No se encontró URL m3u8");
    return;
  }

  console.log("URL m3u8 encontrada:", m3u8Url);
};

main();