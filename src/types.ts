export type RadioCategory = 'news' | 'weather' | 'traffic' | 'randomFact' | 'music';

export interface ScheduledItem {
    time: string; // Format: 'HH:MM'
    category: RadioCategory | RadioCategory[];
    metadata?: Record<string, any>;
}

export type RadioSchedule = ScheduledItem[];

export interface RadioConfig {
  language: string; // 'en', 'el', etc.
  location: {
    city: string;
    region?: string;
    country: string; // ISO 3166-1 code, e.g. 'GR'
  };
}
