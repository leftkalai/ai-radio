import 'dotenv/config';

import cors from '@fastify/cors';
import Fastify from 'fastify';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';

import { loadEnv } from './env.ts';
import { contentGenerators } from './content/index.ts';
import { generateAnnouncement } from './ai.ts';
import { synthesizeSpeech } from './tts.ts';
import { sanitizeFilename } from './utils.ts';
import { RadioCategory } from './types.ts';

const env = loadEnv();

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL || 'info'
  }
});
await app.register(cors, { origin: true });

const JobStatus = z.enum(['queued', 'running', 'succeeded', 'failed']);

type Job = {
  id: string;
  status: z.infer<typeof JobStatus>;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  request: unknown;
  outputPath?: string;
  error?: string;
};

const JobRequestSchema = z.object({
  time: z.string().optional(), // for filename/metadata
  category: z.union([z.string(), z.array(z.string())]),
  metadata: z.record(z.any()).optional(),
  config: z
    .object({
      language: z.string().optional(),
      location: z
        .object({
          city: z.string().optional(),
          region: z.string().optional(),
          country: z.string().optional()
        })
        .optional()
    })
    .optional()
});

const jobs = new Map<string, Job>();
const queue: string[] = [];
let workerRunning = false;

function nowIso() {
  return new Date().toISOString();
}

function ensureOutputDir() {
  return fsp.mkdir(env.OUTPUT_DIR, { recursive: true });
}

async function runJob(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running';
  job.startedAt = nowIso();

  try {
    await ensureOutputDir();

    const parsed = JobRequestSchema.parse(job.request);
    const categories = Array.isArray(parsed.category) ? parsed.category : [parsed.category];

    const cfg = {
      language: parsed.config?.language ?? env.LANGUAGE,
      location: {
        city: parsed.config?.location?.city ?? env.CITY,
        region: parsed.config?.location?.region ?? env.REGION,
        country: parsed.config?.location?.country ?? env.COUNTRY
      }
    };

    const time = parsed.time ?? new Date().toTimeString().slice(0, 5);

    const rawSegments = await Promise.all(
      categories.map(async (cat) => {
        const key = cat as RadioCategory;
        const generator = (contentGenerators as any)[key];
        if (!generator) return `• ${cat.toUpperCase()}: (unsupported category)`;
        const raw = await generator(cfg, parsed.metadata);
        return `• ${cat.toUpperCase()}: ${raw}`;
      })
    );

    const combinedRaw = rawSegments.join('\n');

    const announcement = await generateAnnouncement({
      category: categories.join('+'),
      raw: combinedRaw,
      time,
      config: cfg,
      metadata: parsed.metadata
    });

    const fileBase = sanitizeFilename(`${time}-${categories.join('+')}-${jobId}`);
    const outputPath = path.resolve(env.OUTPUT_DIR, `${fileBase}.mp3`);

    await synthesizeSpeech(announcement, outputPath);

    job.status = 'succeeded';
    job.outputPath = outputPath;
    job.finishedAt = nowIso();

    app.log.info({ jobId, outputPath }, 'Job succeeded');
  } catch (e: any) {
    job.status = 'failed';
    job.error = e?.message ? String(e.message) : String(e);
    job.finishedAt = nowIso();
    app.log.error({ jobId, err: e }, 'Job failed');
  }
}

async function workerTick() {
  if (workerRunning) return;
  workerRunning = true;
  try {
    while (queue.length) {
      const id = queue.shift()!;
      await runJob(id);
    }
  } finally {
    workerRunning = false;
  }
}

app.get('/health', async () => ({ ok: true }));

app.post('/v1/jobs', async (req, reply) => {
  const id = crypto.randomUUID();
  const job: Job = {
    id,
    status: 'queued',
    createdAt: nowIso(),
    request: req.body ?? {}
  };
  jobs.set(id, job);
  queue.push(id);
  void workerTick();

  return reply.code(202).send({ jobId: id });
});

app.get('/v1/jobs/:jobId', async (req, reply) => {
  const jobId = (req.params as any).jobId as string;
  const job = jobs.get(jobId);
  if (!job) return reply.code(404).send({ error: 'not_found' });

  // Don’t leak full request if you later add secrets; OK for now.
  return reply.send({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    error: job.error,
    hasAudio: Boolean(job.outputPath)
  });
});

app.get('/v1/jobs/:jobId/audio', async (req, reply) => {
  const jobId = (req.params as any).jobId as string;
  const job = jobs.get(jobId);
  if (!job) return reply.code(404).send({ error: 'not_found' });
  if (job.status !== 'succeeded' || !job.outputPath) {
    return reply.code(409).send({ error: 'not_ready', status: job.status });
  }

  const p = job.outputPath;
  if (!fs.existsSync(p)) return reply.code(410).send({ error: 'gone' });

  reply.header('Content-Type', 'audio/mpeg');
  reply.header('Content-Disposition', `attachment; filename="${path.basename(p)}"`);
  return reply.send(fs.createReadStream(p));
});

const PORT = Number(process.env.PORT || 8787);
await app.listen({ port: PORT, host: '0.0.0.0' });
app.log.info({ port: PORT }, 'API listening');
