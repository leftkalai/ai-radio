import fetch from 'node-fetch';

interface RandomFactResponse {
  id: string;
  text: string;
  source: string;
  source_url: string;
  language: string;
  permalink: string;
}

export async function fetchRandomFact(): Promise<string> {
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    const data = await res.json() as RandomFactResponse;

    return data.text ?? 'Here’s a random fact: something amazing exists!';
  } catch (err) {
    return 'Random fact unavailable due to a network error.';
  }
}
