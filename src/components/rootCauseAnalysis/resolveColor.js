// ECharts paints on canvas, which can't read CSS variables — resolve a Tailwind
// palette var (e.g. "var(--color-violet-500)") to its computed color.
export function resolveColor(color) {
  const name = color.match(/^var\((--[\w-]+)\)$/)?.[1];
  if (!name) return color;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    color
  );
}
