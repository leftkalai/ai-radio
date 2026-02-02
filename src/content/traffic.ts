import { RadioConfig } from '../types.ts';

export async function fetchTraffic(config: RadioConfig): Promise<string> {
  const { city, region } = config.location;
  // TODO: Implement real API
  return `Traffic in ${region ?? city} is flowing smoothly with occasional slowdowns.`;
}
