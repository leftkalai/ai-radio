import 'dotenv/config';

import { config, schedule } from './src/config.ts';
import { loadEnv } from './src/env.ts';
import { createLogger } from './src/logger.ts';
import { startRadio } from './src/scheduler.ts';

// Validate env and boot.
const env = loadEnv();
const logger = createLogger(env);

logger.info(
  {
    language: config.language,
    location: config.location,
    schedule
  },
  'Starting AI Radio'
);

startRadio(schedule, config, logger, {
  outputDir: env.OUTPUT_DIR,
  demoOnce: Boolean(env.DEMO_ONCE)
});