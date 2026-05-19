export function getYLimits(data, metric) {
  if (!data || !data.length) {
    return getDefaultLimits(metric);
  }

  const values = data.map(d => d[metric]).filter(v => v != null);
  if (values.length === 0) return getDefaultLimits(metric);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const paddedMin = min - range * 0.15;
  const paddedMax = max + range * 0.15;

  switch (metric) {
    case 'temp': return { min: Math.floor(paddedMin / 10) * 10, max: Math.ceil(paddedMax / 10) * 10, step: 10 };
    case 'humidity': return { min: 0, max: 100, step: 20 };
    case 'wind': return { min: 0, max: Math.ceil(paddedMax / 20) * 20 || 100, step: 20 };
    case 'uv': return { min: 0, max: Math.max(11, Math.ceil(paddedMax)), step: 3 };
    default: return getDefaultLimits(metric);
  }
}

function getDefaultLimits(metric) {
  switch (metric) {
    case 'temp': return { min: -20, max: 40, step: 10 };
    case 'humidity': return { min: 0, max: 100, step: 20 };
    case 'wind': return { min: 0, max: 100, step: 20 };
    case 'uv': return { min: 0, max: 11, step: 3 };
    default: return { min: 0, max: 100, step: 10 };
  }
}
