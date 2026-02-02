import 'dotenv/config';

import axios from 'axios';
import fs from 'node:fs/promises';
import path from 'node:path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ELEVENLABS_API_KEY');
}

const OUT_DIR = process.env.VOICE_TEST_OUT_DIR || './output/voice-tests';
const MODEL_ID = process.env.ELEVEN_MODEL_ID || 'eleven_multilingual_v2';
const STABILITY = process.env.ELEVEN_STABILITY ? Number(process.env.ELEVEN_STABILITY) : 0.28;
const SIMILARITY = process.env.ELEVEN_SIMILARITY ? Number(process.env.ELEVEN_SIMILARITY) : 0.75;

const SAMPLE_TEXT =
  process.env.VOICE_TEST_TEXT ||
  [
    'Καλημέρα — είσαι στο AI Radio.',
    'Μικρή ενημέρωση και μετά πάμε μουσική.',
    'Σήμερα στην Αθήνα έχει ζέστη, αλλά το βραδάκι θα μαλακώσει.',
    'Πάμε χαλαρά — και αν κολλήσεις στην κίνηση, βάλε λίγο υπομονή.',
    'Σε λίγο επιστρέφουμε.'
  ].join('\n');

async function listVoices() {
  const res = await axios.get('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });
  return res.data?.voices || [];
}

async function tts(voiceId: string, filePath: string) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await axios.post(
    url,
    {
      text: SAMPLE_TEXT,
      model_id: MODEL_ID,
      voice_settings: {
        stability: STABILITY,
        similarity_boost: SIMILARITY
      }
    },
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      },
      responseType: 'arraybuffer'
    }
  );

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(res.data), 'binary');
}

function safe(s: string) {
  return s.replaceAll(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

(async () => {
  const voices = await listVoices();

  // If VOICE_IDS is provided, use those; else pick top 8 voices.
  const wanted = (process.env.VOICE_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const picks = wanted.length
    ? voices.filter((v: any) => wanted.includes(v.voice_id))
    : voices.slice(0, 8);

  console.log(`Generating ${picks.length} samples to ${OUT_DIR}`);

  for (const v of picks) {
    const name = v.name || v.voice_id;
    const file = path.join(OUT_DIR, `${safe(name)}-${v.voice_id}.mp3`);
    console.log(`- ${name} (${v.voice_id}) -> ${file}`);
    await tts(v.voice_id, file);
  }

  console.log('Done. Play the files and pick your favorite voiceId.');
})();
