import { z } from 'zod';

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  ELEVENLABS_API_KEY: z.string().min(1, 'ELEVENLABS_API_KEY is required'),
  ELEVENLABS_VOICE_ID: z.string().min(1).default('JBFqnCBsd6RMkjVDRZzb'),
//EXAVITQu4vr4xnSDxMaL
  // Optional content APIs
  NEWS_API_KEY: z.string().optional(),
  WEATHER_API_KEY: z.string().optional(),

  LANGUAGE: z.string().default('el'),
  CITY: z.string().default('Athens'),
  REGION: z.string().optional(),
  COUNTRY: z.string().min(2).default('GR'),

  OUTPUT_DIR: z.string().default('./output'),
  LOG_LEVEL: z.string().default('info'),

  // Continuity memory file (local)
  STATE_PATH: z.string().default('./output/state.json'),

  // Voice / tone parameters
  STATION_NAME: z.string().default('AI Radio'),
  HOST_NAME: z.string().default('Sam'),
  ENERGY_BASE: z.coerce.number().min(0).max(1).default(0.45),
  ENERGY_VARIANCE: z.coerce.number().min(0).max(1).default(0.25),

  // ElevenLabs tuning
  ELEVEN_MODEL_ID: z.string().default('eleven_multilingual_v2'),
  ELEVEN_STABILITY: z.coerce.number().min(0).max(1).default(0.28),
  ELEVEN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.75),

  // Language enforcement
  FORCE_LANGUAGE: z
    .string()
    .optional()
    .transform((v) => (v || '').toLowerCase())
    .transform((v) => v === '1' || v === 'true' || v === 'yes')
    .default('true' as any),

  PORT: z.coerce.number().int().positive().default(8787),

  // Demo mode: run one tick and exit
  DEMO_ONCE: z
    .string()
    .optional()
    .transform((v) => (v || '').toLowerCase())
    .transform((v) => v === '1' || v === 'true' || v === 'yes')
    .optional()
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): AppEnv {
  // Allow defaults for optional vars; require keys.
  const obj = {
    OPENAI_API_KEY: raw.OPENAI_API_KEY,
    OPENAI_MODEL: raw.OPENAI_MODEL,
    ELEVENLABS_API_KEY: raw.ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID: raw.ELEVENLABS_VOICE_ID,
    NEWS_API_KEY: raw.NEWS_API_KEY,
    WEATHER_API_KEY: raw.WEATHER_API_KEY,
    LANGUAGE: raw.LANGUAGE,
    CITY: raw.CITY,
    REGION: raw.REGION,
    COUNTRY: raw.COUNTRY,
    OUTPUT_DIR: raw.OUTPUT_DIR,
    LOG_LEVEL: raw.LOG_LEVEL,
    STATE_PATH: raw.STATE_PATH,
    STATION_NAME: raw.STATION_NAME,
    HOST_NAME: raw.HOST_NAME,
    ENERGY_BASE: raw.ENERGY_BASE,
    ENERGY_VARIANCE: raw.ENERGY_VARIANCE,
    ELEVEN_MODEL_ID: raw.ELEVEN_MODEL_ID,
    ELEVEN_STABILITY: raw.ELEVEN_STABILITY,
    ELEVEN_SIMILARITY: raw.ELEVEN_SIMILARITY,
    FORCE_LANGUAGE: raw.FORCE_LANGUAGE,
    PORT: raw.PORT,
    DEMO_ONCE: raw.DEMO_ONCE
  };

  return EnvSchema.parse(obj);
}
