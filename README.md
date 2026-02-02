# ai-radio

Local AI radio segment generator.

- Fetches raw content (news/weather/traffic/random facts/music info)
- Uses **OpenAI** to turn it into a spoken-style radio announcement
- Uses **ElevenLabs** to synthesize an MP3
- Writes output files to `./output/`

## Setup

1) Install deps

```bash
npm install
```

2) Configure env

Copy `.env.example` → `.env` and fill:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`

```bash
cp .env.example .env
```

## Run (dev)

### Scheduler mode (writes MP3s on a schedule)

```bash
npm start
```

### API mode (request → async job → MP3)

```bash
npm run serve
```

## API usage (async jobs)

Create a job:

```bash
curl -X POST http://localhost:8787/v1/jobs \
  -H 'content-type: application/json' \
  -d '{
    "category": ["music"],
    "metadata": {"title": "Paint It Black", "artist": "The Rolling Stones"}
  }'
```

Poll status:

```bash
curl http://localhost:8787/v1/jobs/<jobId>
```

Download MP3 when ready:

```bash
curl -L http://localhost:8787/v1/jobs/<jobId>/audio -o out.mp3
```

## Build + run (prod-like)

### Scheduler (built)

```bash
npm run start:prod
```

### API server (built)

```bash
npm run serve:prod
```

## Notes / next steps for real production
- Add Dockerfile + healthcheck
- Replace in-memory scheduling with a job runner / cron
- Add retry/backoff + rate limiting for OpenAI/ElevenLabs
- Add structured logging + metrics
