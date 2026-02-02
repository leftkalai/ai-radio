import fetch from 'node-fetch';
import { RadioConfig } from '../types.ts';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

interface NewsApiArticle {
  title: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
  message?: string; // appears if there's an error
}

export async function fetchNews(config: RadioConfig): Promise<string> {
  const { country } = config.location;

  const baseUrl = 'https://newsapi.org/v2/top-headlines';

  const globalUrl = `${baseUrl}/sources?apiKey=${NEWS_API_KEY}`;
  const localUrl = `${baseUrl}?country=${country}&apiKey=${NEWS_API_KEY}`;

  try {
    const [globalRes, localRes] = await Promise.all([
      fetch(globalUrl),
      fetch(localUrl)
    ]);

    const globalData = await globalRes.json() as NewsApiResponse;
    const localData = await localRes.json() as NewsApiResponse;

    const globalHeadline =
      globalData.articles?.[0]?.title ?? globalData.message ?? 'No global headline available.';
    const localHeadline =
      localData.articles?.[0]?.title ?? localData.message ?? 'No local headline available.';

    return `Global news: ${globalHeadline}\nLocal news: ${localHeadline}`;
  } catch (err) {
    console.log("ERROR!", err)
    return 'News data unavailable due to a network error.';
  }
}
