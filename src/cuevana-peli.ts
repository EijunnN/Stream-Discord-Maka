import cheerio from "cheerio";
import puppeteer from "puppeteer";
import axios from "axios";

interface Video {
  cyberlocker: string;
  result: string;
}

interface VideoLanguages {
  [key: string]: Video[];
}

interface PageProps {
  thisMovie?: {
    videos?: VideoLanguages;
  };
}

export const fetchDataMovie = async (
  url: string
): Promise<PageProps | null> => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const script = $("#__NEXT_DATA__");
    if (script.length) {
      const scriptContent = script.html();
      if (scriptContent) {
        const data = JSON.parse(scriptContent);
        return data.props.pageProps;
      }
    }
    throw new Error("No se encontraron datos de __NEXT_DATA__");
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, (error as Error).message);
    return null;
  }
};

export const fetchVideoUrl2 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const script = $("script")
      .filter((i, el) => $(el).html()?.includes("var url =") ?? false)
      .first();
    const scriptContent = script.html();
    const urlMatch = scriptContent?.match(/var url = '(.+?)'/) ?? null;
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    console.error(
      `Error fetching video URL from ${url}:`,
      (error as Error).message
    );
    return null;
  }
};

export const fetchM3U8Url2 = async (url: string): Promise<string | null> => {
  const browser = await puppeteer.launch({ headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
   });
  const page = await browser.newPage();
  let m3u8Url: string | null = null;

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes(".m3u8")) {
      m3u8Url = request.url();
    }
    request.continue();
  });

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error(`Error navigating to ${url}:`, (error as Error).message);
  } finally {
    await browser.close();
  }

  return m3u8Url;
};

async function verifyM3U8(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url);
    const content = response.data;

    if (!content.trim().startsWith('#EXTM3U')) {
      return false;
    }

    // console.log('M3U8 content seems valid:', content.slice(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('Error fetching m3u8 content:', error);
    return false;
  }
}

async function tryFetchM3U8(lang: string, cyberlocker: string, videoUrl: string): Promise<string | null> {
  try {
    const embeddedVideoUrl = await fetchVideoUrl2(videoUrl);
    if (!embeddedVideoUrl) {
      console.log(`No se encontró URL de video embebido para ${lang} - ${cyberlocker}`);
      return null;
    }

    const m3u8Url = await fetchM3U8Url2(embeddedVideoUrl);
    if (m3u8Url) {
      console.log(`Se encontró URL m3u8 para ${lang} - ${cyberlocker}: ${m3u8Url}`);
      if (await verifyM3U8(m3u8Url)) {
        return m3u8Url;
      } else {
        console.log(`URL m3u8 inválida para ${lang} - ${cyberlocker}`);
      }
    } else {
      console.log(`No se encontró URL m3u8 para ${lang} - ${cyberlocker}`);
    }
    return null;
  } catch (error) {
    console.error(`Error procesando ${lang} - ${cyberlocker}:`, (error as Error).message);
    return null;
  }
}

export const getM3U8FromCuevana2 = async (url: string): Promise<string> => {
  const movie = await fetchDataMovie(url);
  if (!movie) {
    throw new Error("No se encontraron datos de video");
  }

  const videos = movie.thisMovie?.videos ?? {};
  const priorityLanguages = ["latino", "english"];
  const priorityCyberlockers = ["filemoon", "voesx", "streamwish"];

  // First, try priority languages with priority cyberlockers
  for (const lang of priorityLanguages) {
    if (videos[lang] && videos[lang].length > 0) {
      for (const prio of priorityCyberlockers) {
        const video = videos[lang].find((v) => v.cyberlocker === prio);
        if (video) {
          const result = await tryFetchM3U8(lang, prio, video.result);
          if (result) return result;
        }
      }
    }
  }

  // If not found, try priority languages with non-priority cyberlockers
  for (const lang of priorityLanguages) {
    if (videos[lang] && videos[lang].length > 0) {
      for (const video of videos[lang]) {
        if (!priorityCyberlockers.includes(video.cyberlocker)) {
          const result = await tryFetchM3U8(lang, video.cyberlocker, video.result);
          if (result) return result;
        }
      }
    }
  }

  // If still not found, try other languages
  for (const lang in videos) {
    if (!priorityLanguages.includes(lang) && videos[lang].length > 0) {
      for (const video of videos[lang]) {
        const result = await tryFetchM3U8(lang, video.cyberlocker, video.result);
        if (result) return result;
      }
    }
  }

  throw new Error("No se encontró URL m3u8 válida en ninguna fuente disponible");
};