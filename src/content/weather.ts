import fetch from 'node-fetch';
import { RadioConfig } from '../types.ts';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

interface WeatherApiResponse {
  weather: { description: string }[];
  main: { temp: number };
  message?: string;
}

export async function fetchWeather(config: RadioConfig): Promise<string> {
  const { city, country } = config.location;
  const { language } = config;

  const query = `${encodeURIComponent(city)},${country}`;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${WEATHER_API_KEY}&units=metric&lang=${language}`;

  try {
    const res = await fetch(url);
    const data = await res.json() as WeatherApiResponse;

    if (!res.ok) {
      const msg = data?.message ?? 'Unknown error';
      return `Weather data unavailable for ${city}: ${msg}`;
    }

    const weather = data.weather?.[0]?.description ?? 'unknown';
    const temp = data.main?.temp ?? '?';

    return `The weather in ${city} is ${weather} with a temperature of ${temp}°C.`;
  } catch (err) {
    return `Weather data unavailable for ${city} due to a network error.`;
  }
}
