// log.ts — tiny structured console logger for the iMessage layer (no DB, no dep).
/* eslint-disable @typescript-eslint/no-explicit-any */
export const log = {
  info: (event: string, data?: any) => console.log(`· ${event}`, data ?? ''),
  debug: (event: string, data?: any) => {
    if (process.env.DEBUG) console.log(`  ${event}`, data ?? '');
  },
  warn: (event: string, data?: any) => console.warn(`! ${event}`, data ?? ''),
  error: (event: string, err?: any, data?: any) =>
    console.error(`✗ ${event}`, err instanceof Error ? err.message : (err ?? ''), data ?? ''),
};
