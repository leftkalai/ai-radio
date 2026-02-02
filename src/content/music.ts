import { RadioConfig } from '../types.ts';
import axios from 'axios';

export async function fetchMusicSegment(config: RadioConfig, metadata?: { title?: string; artist?: string }): Promise<string> {
  const { title, artist } = metadata ?? {};

  if (!title) return 'No song information provided.';

  const query = artist ? `${title} ${artist}` : title;

  const response = await axios.get('https://api.duckduckgo.com/', {
    params: {
      q: query,
      format: 'json',
      no_redirect: 1
    }
  });

  const snippet = response.data.Abstract || response.data.RelatedTopics?.[0]?.Text;

  return snippet
    ? `Here’s something about "${title}" by ${artist ?? 'an unknown artist'}: ${snippet}`
    : `Couldn't find details for "${title}"${artist ? ` by ${artist}` : ''}.`;
}
