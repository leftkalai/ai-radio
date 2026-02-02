import OpenAI from 'openai';
import { RadioCategory, RadioConfig } from './types.ts';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

const languageNames: Record<string, string> = {
  en: 'English',
  el: 'Greek',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  sv: 'Swedish',
  pl: 'Polish',
  tr: 'Turkish',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean'
};

export async function generateAnnouncement(params: {
  category: RadioCategory | string;
  raw: string;
  time: string;
  config: RadioConfig;
  metadata?: Record<string, any>;
  continuity?: {
    stationName?: string;
    hostName?: string;
    energyHint?: number; // 0..1
    recentContext?: string;
  };
}): Promise<string> {
  const { category, raw, time, config, metadata, continuity } = params;
  const language = languageNames[config.language] ?? config.language;

  const stationName = continuity?.stationName || process.env.STATION_NAME || 'AI Radio';
  const hostName = continuity?.hostName || process.env.HOST_NAME || 'Sam';
  const energy =
    typeof continuity?.energyHint === 'number'
      ? continuity.energyHint
      : process.env.ENERGY_BASE
        ? Number(process.env.ENERGY_BASE)
        : 0.45;
  const recentContext = continuity?.recentContext || '';

  const isMusic = category === 'music';
  const songTitle = metadata?.title;
  const songArtist = metadata?.artist;

  const persona = `You are ${hostName}, the host of ${stationName}.\n\nTone guidance:\n- Mostly chill and conversational; occasionally energetic (not always).\n- Never sound like it's your first prompt. This is a continuous broadcast.\n- Avoid repeating the same opener/closer phrasing. Vary sentence starts.\n- Keep sentences short for TTS. Use natural punctuation and line breaks.\n- If appropriate, use subtle continuity ("as we mentioned earlier", "coming up", etc.) but don't force it.\n- Energy level (0..1): ${energy.toFixed(2)}\n`;

  const continuityBlock = recentContext
    ? `Recent broadcast context (for continuity; do NOT quote verbatim):\n${recentContext}\n`
    : '';

  const ttsRules = `TTS rules:\n- No emojis.\n- No URLs.\n- Avoid long parentheticals.\n- Prefer 1–2 sentences per line (use line breaks).\n- Write numbers as words.\n`;

  const prompt = isMusic
    ? `${persona}\n${ttsRules}\n${continuityBlock}\nYou are doing a music segment.\nSong: "${songTitle}"${songArtist ? ` by ${songArtist}` : ''}.\nRaw notes:\n${raw}\n\nWrite a short DJ-style spoken intro/outro (5–10 lines). Add a light fun fact if you have it, but stay believable. Use this language: ${language}.`
    : `${persona}\n${ttsRules}\n${continuityBlock}\nTopics: ${category}.\nRaw notes:\n${raw}\n\nWrite one flowing spoken segment (6–12 lines). Blend related info naturally. Use this language: ${language}. Time context: around ${time}. City: ${config.location.city} (only if it fits naturally).`;

  const openai = getOpenAI();
  if (!openai) throw new Error('Missing OPENAI_API_KEY');

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  return response.choices[0].message?.content?.trim() ?? raw;
}
