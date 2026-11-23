export function dashboardSeries(value: unknown): number[] {
  if (!Array.isArray(value)) throw new Error('Invalid chart data');
  return value.map(item => {
    if ((typeof item !== 'number' && typeof item !== 'string') || (typeof item === 'string' && !item.trim())) throw new Error('Invalid chart value');
    const number = Number(item);
    if (!Number.isFinite(number)) throw new Error('Invalid chart value');
    return number;
  });
}
export function dashboardPropertyTypes(value: unknown): Array<{ name: string; value: number }> {
  if (!Array.isArray(value)) throw new Error('Invalid property statistics');
  return value.flatMap(item => {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) return [];
    if ((typeof item.value !== 'number' && typeof item.value !== 'string') || String(item.value).trim() === '') return [];
    const count = Number(item.value);
    return Number.isFinite(count) && count >= 0 ? [{ name: item.name.trim(), value: count }] : [];
  });
}
