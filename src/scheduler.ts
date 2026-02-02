import path from 'node:path';

import { contentGenerators } from './content/index.ts';
import { generateAnnouncement } from './ai.ts';
import { synthesizeSpeech } from './tts.ts';
import { sanitizeFilename } from './utils.ts';
import {
  addRecent,
  buildContinuityContext,
  loadState,
  saveState
} from './state.ts';
import { RadioCategory, RadioConfig, RadioSchedule } from './types.ts';

type Logger = {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

function hhmm(date: Date) {
  return date.toTimeString().slice(0, 5); // 'HH:MM'
}

function msUntilNextTick(now = new Date()) {
  // Run very shortly after the next minute boundary.
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return Math.max(250, next.getTime() - now.getTime() + 250);
}

export function startRadio(
  schedule: RadioSchedule,
  config: RadioConfig,
  logger: Logger,
  options?: { outputDir?: string; demoOnce?: boolean; statePath?: string }
) {
  const alreadyAnnounced = new Set<string>();
  const outputDir = options?.outputDir || './output';
  const statePath = options?.statePath || `${outputDir}/state.json`;
  const demoOnce = options?.demoOnce === true;

  async function tick() {
    const now = new Date();
    const currentTime = hhmm(now);

    for (const item of schedule) {
      const categories = Array.isArray(item.category) ? item.category : [item.category];
      const key = `${item.time}-${categories.join('+')}`;

      if (item.time !== currentTime || alreadyAnnounced.has(key)) continue;

      try {
        const rawSegments = await Promise.all(
          categories.map(async (cat) => {
            const generator = contentGenerators[cat];
            const raw = await generator(config, item.metadata);
            return `• ${cat.toUpperCase()}: ${raw}`;
          })
        );

        const combinedRaw = rawSegments.join('\n');

        const state = await loadState(statePath);
        const recentContext = buildContinuityContext(state);

        const energyBase = process.env.ENERGY_BASE ? Number(process.env.ENERGY_BASE) : 0.45;
        const energyVar = process.env.ENERGY_VARIANCE ? Number(process.env.ENERGY_VARIANCE) : 0.25;
        const energyHint = Math.max(0, Math.min(1, energyBase + (Math.random() - 0.5) * 2 * energyVar));

        const announcement = await generateAnnouncement({
          category: categories.join('+') as RadioCategory,
          raw: combinedRaw,
          time: currentTime,
          config,
          metadata: item.metadata,
          continuity: {
            stationName: process.env.STATION_NAME,
            hostName: process.env.HOST_NAME,
            energyHint,
            recentContext
          }
        });

        addRecent(state, {
          ts: new Date().toISOString(),
          category: categories.join('+'),
          text: announcement
        });
        await saveState(statePath, state);

        const fileBase = sanitizeFilename(`${currentTime}-${categories.join('+')}`);
        const outputPath = path.resolve(`${outputDir}/${fileBase}.mp3`);
        await synthesizeSpeech(announcement, outputPath);

        logger.info({ time: item.time, categories }, `Audio ready: ${outputPath}`);
        alreadyAnnounced.add(key);

        if (demoOnce) {
          logger.info('DEMO_ONCE enabled; exiting after first successful generation');
          process.exit(0);
        }
      } catch (error) {
        logger.error({ err: error, categories }, 'Failed to produce combined segment');
      }
    }

    setTimeout(tick, msUntilNextTick());
  }

  logger.info({ scheduleItems: schedule.length }, 'AI Radio scheduler started');
  setTimeout(tick, 250);
}
