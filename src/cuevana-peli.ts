import cheerio, { load } from "cheerio";
import puppeteer from "puppeteer";
import axios, { AxiosInstance } from "axios";
import { HttpProxyAgent } from "http-proxy-agent";

import { Movie, IMovie } from "./models/movie";
import mongoose from "mongoose";

const uri =
  "mongodb+srv://avmezaa:owUf38RmphNeQq4T@cluster0.r8pdzmy.mongodb.net/prueba3?retryWrites=true&w=majority&appName=AtlasApp";

mongoose
  .connect(uri)
  .then(() => {
    console.log("Conectado a MongoDB");
  })
  .catch((error) => {
    console.log("Error al conectar a MongoDB:", error);
  });

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

const proxyConfig = {
  host: "gw.dataimpulse.com",
  port: 823,
  auth: {
    username: "661e9d1fda89d1e94039",
    password: "ed8934de4aebeb2c",
  },
};

export const fetchDataMovie = async (
  url: string
): Promise<PageProps | null> => {
  try {
    const response = await fetch(url);

    const html = await response.text();

    const $ = load(html);

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
    // const $ = cheerio.load(html);
    const $ = load(html);
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
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

    if (!content.trim().startsWith("#EXTM3U")) {
      return false;
    }

    // console.log('M3U8 content seems valid:', content.slice(0, 200) + '...');
    return true;
  } catch (error) {
    console.error("Error fetching m3u8 content:", error);
    return false;
  }
}

async function tryFetchM3U8(
  lang: string,
  cyberlocker: string,
  videoUrl: string
): Promise<string | null> {
  try {
    const embeddedVideoUrl = await fetchVideoUrl2(videoUrl);
    if (!embeddedVideoUrl) {
      console.log(
        `No se encontró URL de video embebido para ${lang} - ${cyberlocker}`
      );
      return null;
    }
    console.log(embeddedVideoUrl, "xd");
    const m3u8Url = await fetchM3U8Url2(embeddedVideoUrl);
    if (m3u8Url) {
      console.log(
        `Se encontró URL m3u8 para ${lang} - ${cyberlocker}: ${m3u8Url}`
      );
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
    console.error(
      `Error procesando ${lang} - ${cyberlocker}:`,
      (error as Error).message
    );
    return null;
  }
}

// export const getM3U8FromCuevana2 = async (url: string): Promise<string> => {
//   const movie = await fetchDataMovie(url);
//   if (!movie) {
//     throw new Error("No se encontraron datos de video");
//   }

//   const videos = movie.thisMovie?.videos ?? {};
//   const priorityLanguages = ["latino", "english"];
//   const priorityCyberlockers = ["filemoon", "voesx", "streamwish"];

//   // First, try priority languages with priority cyberlockers
//   for (const lang of priorityLanguages) {
//     if (videos[lang] && videos[lang].length > 0) {
//       for (const prio of priorityCyberlockers) {
//         console.log(`priorityCyberlockers ${prio}`);
//         const video = videos[lang].find((v) => v.cyberlocker === prio);
//         if (video) {
//           const result = await tryFetchM3U8(lang, prio, video.result);
//           if (result) return result;
//         }
//       }
//     }
//   }

//   // If not found, try priority languages with non-priority cyberlockers
//   for (const lang of priorityLanguages) {
//     if (videos[lang] && videos[lang].length > 0) {
//       for (const video of videos[lang]) {
//         if (!priorityCyberlockers.includes(video.cyberlocker)) {
//           const result = await tryFetchM3U8(
//             lang,
//             video.cyberlocker,
//             video.result
//           );
//           if (result) return result;
//         }
//       }
//     }
//   }

//   // If still not found, try other languages
//   for (const lang in videos) {
//     if (!priorityLanguages.includes(lang) && videos[lang].length > 0) {
//       for (const video of videos[lang]) {
//         const result = await tryFetchM3U8(
//           lang,
//           video.cyberlocker,
//           video.result
//         );
//         if (result) return result;
//       }
//     }
//   }

//   throw new Error(
//     "No se encontró URL m3u8 válida en ninguna fuente disponible"
//   );
// };

export const getM3U8FromCuevana2 = async (url: string): Promise<string> => {
  try {
    const movie = await fetchMovieFromDatabase(url);
    if (movie) {
      const m3u8Url = await getM3U8FromMovie(movie);
      if (m3u8Url) return m3u8Url;
    }

    // If movie not found in database or m3u8 not available, fetch and add to database
    const pageProps = await fetchDataMovie(url);
    if (!pageProps) throw new Error("No se encontraron datos de video");

    const newMovie = await addMovieToDatabase(pageProps);
    return await getM3U8FromMovie(newMovie);
  } catch (error) {
    console.error("Error in getM3U8FromCuevana2:", error);
    throw error;
  }
};

const fetchMovieFromDatabase = async (url: string): Promise<IMovie | null> => {
  const slug = url.split("/").pop();
  return await Movie.findOne({ "additional_data.thisMovie.url.slug": slug });
};

const addMovieToDatabase = async (pageProps: any): Promise<IMovie> => {
  const movieData = {
    tmdb_id: pageProps.thisMovie.TMDbId,
    titles: pageProps.thisMovie.titles.name,
    additional_data: {
      thisMovie: pageProps.thisMovie,
    },
    video_urls: pageProps.thisMovie.videos.english.concat(
      pageProps.thisMovie.videos.spanish,
      pageProps.thisMovie.videos.latino
    ),
  };

  const movie = new Movie(movieData);
  await movie.save();
  return movie;
};

const getM3U8FromMovie = async (movie: IMovie): Promise<string> => {
  const priorityLanguages = ["latino", "english", "spanish"];
  const priorityCyberlockers = ["filemoon", "voesx", "streamwish"];

  for (const lang of priorityLanguages) {
    const videos = movie.additional_data.thisMovie.videos[lang];
    if (videos && videos.length > 0) {
      for (const prio of priorityCyberlockers) {
        const video = videos.find((v) => v.cyberlocker === prio);
        if (video) {
          const result = await tryFetchM3U8(lang, prio, video.result);
          if (result) return result;
        }
      }
      // If priority cyberlockers not found, try others
      for (const video of videos) {
        const result = await tryFetchM3U8(
          lang,
          video.cyberlocker,
          video.result
        );
        if (result) return result;
      }
    }
  }

  throw new Error(
    "No se encontró URL m3u8 válida en ninguna fuente disponible"
  );
};

// // Solucion 2
// import cheerio, { load } from "cheerio";
// import puppeteer from "puppeteer";
// import axios, { AxiosInstance } from "axios";
// import { HttpsProxyAgent } from "https-proxy-agent";

// interface Video {
//   cyberlocker: string;
//   result: string;
// }

// interface VideoLanguages {
//   [key: string]: Video[];
// }

// interface PageProps {
//   thisMovie?: {
//     videos?: VideoLanguages;
//   };
// }

// const proxyConfig = {
//   host: "gw.dataimpulse.com",
//   port: 823,
//   auth: {
//     username: "661e9d1fda89d1e94039",
//     password: "ed8934de4aebeb2c",
//   },
// };

// const axiosInstance: AxiosInstance = axios.create({
//   httpsAgent: new HttpsProxyAgent(
//     `http://${proxyConfig.auth.username}:${proxyConfig.auth.password}@${proxyConfig.host}:${proxyConfig.port}`
//   ),
//   headers: {
//     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
//     "Accept": "*/*",
//     "Accept-Language": "en-US,en;q=0.5",
//     "Accept-Encoding": "gzip, deflate, br",
//     "Origin": "https://cuevana3.info",
//     "Referer": "https://cuevana3.info/",
//     "Sec-Fetch-Dest": "empty",
//     "Sec-Fetch-Mode": "cors",
//     "Sec-Fetch-Site": "cross-site",
//     "Connection": "keep-alive",
//   }
// });

// export const fetchDataMovie = async (
//   url: string
// ): Promise<PageProps | null> => {
//   try {
//     const response = await axiosInstance.get(url);
//     const html = response.data;
//     const $ = load(html);

//     const script = $("#__NEXT_DATA__");
//     if (script.length) {
//       const scriptContent = script.html();
//       if (scriptContent) {
//         const data = JSON.parse(scriptContent);
//         return data.props.pageProps;
//       }
//     }
//     throw new Error("No se encontraron datos de __NEXT_DATA__");
//   } catch (error) {
//     console.error(`Error fetching data from ${url}:`, (error as Error).message);
//     return null;
//   }
// };

// export const fetchVideoUrl2 = async (url: string): Promise<string | null> => {
//   try {
//     const response = await axiosInstance.get(url);
//     const html = response.data;
//     const $ = load(html);
//     const script = $("script")
//       .filter((i, el) => $(el).html()?.includes("var url =") ?? false)
//       .first();
//     const scriptContent = script.html();
//     const urlMatch = scriptContent?.match(/var url = '(.+?)'/) ?? null;
//     return urlMatch ? urlMatch[1] : null;
//   } catch (error) {
//     console.error(
//       `Error fetching video URL from ${url}:`,
//       (error as Error).message
//     );
//     return null;
//   }
// };

// export const fetchM3U8Url2 = async (url: string): Promise<string | null> => {
//   const browser = await puppeteer.launch({
//     headless: true,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       `--proxy-server=${proxyConfig.host}:${proxyConfig.port}`,
//     ],
//   });
//   const page = await browser.newPage();
//   await page.authenticate({
//     username: proxyConfig.auth.username,
//     password: proxyConfig.auth.password,
//   });
//   let m3u8Url: string | null = null;

//   await page.setRequestInterception(true);
//   page.on("request", (request) => {
//     if (request.url().includes(".m3u8")) {
//       m3u8Url = request.url();
//     }
//     request.continue();
//   });

//   try {
//     await page.goto(url, { waitUntil: "networkidle2" });
//   } catch (error) {
//     console.error(`Error navigating to ${url}:`, (error as Error).message);
//   } finally {
//     await browser.close();
//   }

//   return m3u8Url;
// };

// async function verifyM3U8(url: string): Promise<boolean> {
//   try {
//     const response = await axiosInstance.get(url, {
//       headers: {
//         Referer: "https://cuevana3.info/",
//         Origin: "https://cuevana3.info",
//       },
//     });
//     const content = response.data;

//     return content.trim().startsWith("#EXTM3U");
//   } catch (error) {
//     console.error("Error fetching m3u8 content:", error);
//     return false;
//   }
// }

// async function tryFetchM3U8(
//   lang: string,
//   cyberlocker: string,
//   videoUrl: string
// ): Promise<string | null> {
//   try {
//     console.log(`Procesando ${lang} - ${cyberlocker}: ${videoUrl}`);

//     const embeddedVideoUrl = await fetchVideoUrl2(videoUrl);
//     if (!embeddedVideoUrl) {
//       console.log(
//         `No se encontró URL de video embebido para ${lang} - ${cyberlocker}`
//       );
//       return null;
//     }

//     const m3u8Url = await fetchM3U8Url2(embeddedVideoUrl);
//     if (m3u8Url) {
//       console.log(
//         `Se encontró URL m3u8 para ${lang} - ${cyberlocker}: ${m3u8Url}`
//       );
//       if (await verifyM3U8(m3u8Url)) {
//         return m3u8Url;
//       } else {
//         console.log(`URL m3u8 inválida para ${lang} - ${cyberlocker}`);
//       }
//     } else {
//       console.log(`No se encontró URL m3u8 para ${lang} - ${cyberlocker}`);
//     }
//     return null;
//   } catch (error) {
//     console.error(
//       `Error procesando ${lang} - ${cyberlocker}:`,
//       (error as Error).message
//     );
//     return null;
//   }
// }

// export const getM3U8FromCuevana2 = async (url: string): Promise<string> => {
//   const movie = await fetchDataMovie(url);
//   if (!movie || !movie.thisMovie || !movie.thisMovie.videos) {
//     throw new Error("No se encontraron datos de video");
//   }

//   const videos = movie.thisMovie.videos;
//   const priorityLanguages = ["latino", "english"];
//   const priorityCyberlockers = ["filemoon", "voesx", "streamwish"];

//   // First, try priority languages with priority cyberlockers
//   for (const lang of priorityLanguages) {
//     if (videos[lang] && videos[lang].length > 0) {
//       for (const prio of priorityCyberlockers) {
//         console.log(`priorityCyberlockers ${prio}`);
//         const video = videos[lang].find((v) => v.cyberlocker === prio);
//         if (video) {
//           const result = await tryFetchM3U8(lang, prio, video.result);
//           if (result) return result;
//         }
//       }
//     }
//   }

//   // If not found, try priority languages with non-priority cyberlockers
//   for (const lang of priorityLanguages) {
//     if (videos[lang] && videos[lang].length > 0) {
//       for (const video of videos[lang]) {
//         if (!priorityCyberlockers.includes(video.cyberlocker)) {
//           const result = await tryFetchM3U8(
//             lang,
//             video.cyberlocker,
//             video.result
//           );
//           if (result) return result;
//         }
//       }
//     }
//   }

//   // If still not found, try other languages
//   for (const lang in videos) {
//     if (!priorityLanguages.includes(lang) && videos[lang].length > 0) {
//       for (const video of videos[lang]) {
//         const result = await tryFetchM3U8(
//           lang,
//           video.cyberlocker,
//           video.result
//         );
//         if (result) return result;
//       }
//     }
//   }

//   throw new Error(
//     "No se encontró URL m3u8 válida en ninguna fuente disponible"
//   );
// };
