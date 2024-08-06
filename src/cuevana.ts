import cheerio from "cheerio";
import puppeteer from "puppeteer";

interface Video {
  cyberlocker: string;
  result: string;
}

interface VideoLanguages {
  [key: string]: Video[];
}

interface PageProps {
  episode?: {
    videos?: VideoLanguages ;
  };

  
}

export const fetchDataSerie = async (url: string): Promise<PageProps | null> => {
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

export const fetchVideoUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const script = $('script').filter((i, el) => $(el).html()?.includes('var url =') ?? false).first();
    const scriptContent = script.html();
    const urlMatch = scriptContent?.match(/var url = '(.+?)'/) ?? null;
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    console.error(`Error fetching video URL from ${url}:`, (error as Error).message);
    return null;
  }
};

export const fetchM3U8Url = async (url: string): Promise<string | null> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let m3u8Url: string | null = null;

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes('.m3u8')) {
      m3u8Url = request.url();
    }
    request.continue();
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    // Replace waitForTimeout with a Promise-based timeout
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    console.error(`Error navigating to ${url}:`, (error as Error).message);
  } finally {
    await browser.close();
  }

  return m3u8Url;
};


export const getPriorityVideoUrl = (pageProps: PageProps): string | null => {
  const videos = pageProps.episode?.videos ?? {};
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



export const getM3U8FromCuevana = async (url: string): Promise<string> => {
  const serie = await fetchDataSerie(url);
  if (!serie) {
    throw new Error("No se encontraron datos de video");
  }

  const videoUrl = getPriorityVideoUrl(serie);
  if (!videoUrl) {
    throw new Error("No se encontró URL de video");
  }

  const embeddedVideoUrl = await fetchVideoUrl(videoUrl);
  if (!embeddedVideoUrl) {
    throw new Error("No se encontró URL de video embebido");
  }

  const m3u8Url = await fetchM3U8Url(embeddedVideoUrl);
  if (!m3u8Url) {
    throw new Error("No se encontró URL m3u8");
  }

  return m3u8Url;
};