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
}): Promise<string> {
  const { category, raw, time, config, metadata } = params;
  const language = languageNames[config.language] ?? config.language;

  const isMusic = category === 'music';
  const songTitle = metadata?.title;
  const songArtist = metadata?.artist;

  const prompt = isMusic
    ? `
You are writing a short radio-style commentary about a song for a music segment.

The song is: "${songTitle}"${songArtist ? ` by ${songArtist}` : ''}.
Here is some raw info about the song:
"${raw}"

Write a short, engaging, spoken-style announcement. It could include background facts, what makes the song special, fun trivia, or emotional tone — like what a radio DJ would say before or after playing it.

Avoid quoting exact descriptions or URLs. Write naturally for a human voice on air.

Use this language: ${language}.
This will be read by a text-to-speech (TTS) system — write clearly, with smooth phrasing, and avoid robotic or overly formal structure. All numbers and times should be written out as words.
`
    : `
You are writing a short, natural-sounding radio-style announcement based on the following topic(s): ${category}.

Here is the raw content to transform:
"${raw}"

Rephrase it in a conversational tone, as if it's part of a continuous radio broadcast. The announcement should **combine all topics naturally** into a single flowing segment — not separate blocks. If two pieces of information relate to each other (e.g. weather and traffic), blend them meaningfully rather than listing them.

Avoid generic introductions like "Hello", "This is", or stating the current time unless it's explicitly part of the message. The message should sound like a seamless part of a live radio stream.

This will be spoken aloud using a text-to-speech (TTS) voice, so write in a way that sounds fluid, clear, and natural when read out loud. Avoid awkward punctuation, overly long sentences, or phrasing that might trip up a speech engine.

Write the announcement in this language: ${language}.
Translate the content if needed. When referring to time or numbers, spell them out as **words**, and use **12-hour format** for time (e.g. "five o'clock" instead of "17:00").

Round any numeric values naturally — for instance, temperatures like 38.7 should be rounded to 39. Avoid excessive precision unless it's important to the message.

You are broadcasting this around ${time} local time. Make sure your message is contextually appropriate — for example, avoid suggesting people "go out for a walk" if it's late at night, or giving commute tips at midnight.

Mention the city (${config.location.city}) if it fits naturally, but don’t repeat or force it unnecessarily.

The result should feel like a polished, friendly radio host speaking live — flowing, listener-friendly, and human.
`;

  const openai = getOpenAI();
  if (!openai) throw new Error('Missing OPENAI_API_KEY');

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  return response.choices[0].message?.content?.trim() ?? raw;
}
