import { RadioCategory, RadioConfig } from '../types.ts';

import { fetchNews } from './news.ts';
import { fetchRandomFact } from './randomFact.ts';
import { fetchTraffic } from './traffic.ts';
import { fetchWeather } from './weather.ts';
import { fetchMusicSegment } from './music.ts';

export const contentGenerators: Record<
  RadioCategory,
  (config: RadioConfig, metadata?: any) => Promise<string>
> = {
  news: fetchNews,
  weather: fetchWeather,
  traffic: fetchTraffic,
  randomFact: fetchRandomFact,
  music: fetchMusicSegment
};
