export const MEZON_CHANNELS = {
  CLEANING: 'Cleaning',
  OPENTALK: 'Opentalk',
  PUNISHMENT: 'Punishment',
} as const;

export type MezonChannelType = keyof typeof MEZON_CHANNELS;
