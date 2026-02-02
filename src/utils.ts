export function sanitizeFilename(input: string) {
  return input
    .replaceAll(':', '-')
    .replaceAll('/', '-')
    .replaceAll('\\', '-')
    .replaceAll(/\s+/g, '_')
    .replaceAll(/[^a-zA-Z0-9._-]/g, '');
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
