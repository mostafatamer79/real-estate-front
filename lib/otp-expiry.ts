export function otpDeadline(value: string | null | undefined, now = Date.now()): number {
  if (!value) return now + 5 * 60_000;
  const deadline = Date.parse(value);
  return Number.isFinite(deadline) ? deadline : now;
}

export function otpSecondsLeft(deadline: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
