import { RadioConfig, RadioSchedule } from './types.ts';

export const config: RadioConfig = {
  language: 'el',
  location: {
    city: 'Athens',
    region: 'Attica',
    country: 'GR'
  }
};

export const schedule: RadioSchedule = [
    { time: new Date().toTimeString().slice(0, 5), category: ['music'], metadata:{ title: 'Paint it Balck', artist: 'The Rolling Stones' } } // runs immediately
  ];
// export const schedule: RadioSchedule = [
//   { time: '10:00', category: 'news' },
//   { time: '10:30', category: 'traffic' },
//   { time: '10:35', category: 'weather' },
//   { time: '10:45', category: 'randomFact' }
// ];
