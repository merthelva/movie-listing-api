export function delayInMs(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
