import fs from 'node:fs/promises';

export type RadioContinuityState = {
  // Rolling memory of the last few announcements (most recent last)
  recent: Array<{
    ts: string;
    category: string;
    text: string;
  }>;
};

const DEFAULT_STATE: RadioContinuityState = { recent: [] };

export async function loadState(statePath: string): Promise<RadioContinuityState> {
  try {
    const raw = await fs.readFile(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
    if (!Array.isArray(parsed.recent)) return DEFAULT_STATE;
    return { recent: parsed.recent.slice(-20) };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveState(statePath: string, state: RadioContinuityState): Promise<void> {
  const trimmed: RadioContinuityState = { recent: state.recent.slice(-20) };
  await fs.writeFile(statePath, JSON.stringify(trimmed, null, 2) + '\n', 'utf8');
}

export function addRecent(
  state: RadioContinuityState,
  entry: { ts: string; category: string; text: string },
  limit = 10
) {
  state.recent.push(entry);
  if (state.recent.length > limit) state.recent = state.recent.slice(-limit);
}

export function buildContinuityContext(state: RadioContinuityState, maxChars = 1200): string {
  const lines: string[] = [];
  for (const r of state.recent.slice(-6)) {
    lines.push(`[${r.category}] ${r.text}`);
  }
  let joined = lines.join('\n');
  if (joined.length > maxChars) joined = joined.slice(joined.length - maxChars);
  return joined;
}
