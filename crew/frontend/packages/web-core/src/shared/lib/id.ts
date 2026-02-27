let seq = 0;

export function genId(): string {
  seq = (seq + 1) & 0xffff;
  return `${Date.now().toString(36)}-${seq.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
