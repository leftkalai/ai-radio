# Scripts

## Voice bake-off (ElevenLabs)

Generates sample MP3s for multiple ElevenLabs voices so you can pick the most natural Greek radio host.

```bash
cd /Users/lefteris/hustla/ai-radio
npm run voice:bakeoff
```

Output: `output/voice-tests/`.

Optional env vars:
- `VOICE_IDS=<id1,id2,...>` (limit to specific voices)
- `VOICE_TEST_TEXT=...` (custom sample)
- `VOICE_TEST_OUT_DIR=...`
