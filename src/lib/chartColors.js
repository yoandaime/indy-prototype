// Resolves this app's grayscale --chart-* design tokens (defined in
// index.css) into concrete CSS color strings ECharts can paint with — canvas
// fillStyle doesn't resolve CSS custom properties on its own.
function readCssVar(name, fallback) {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function getThemeColors() {
  return {
    foreground: readCssVar("--foreground", "oklch(0.145 0 0)"),
    mutedForeground: readCssVar("--muted-foreground", "oklch(0.556 0 0)"),
    border: readCssVar("--border", "oklch(0.922 0 0)"),
    chart1: readCssVar("--chart-1", "oklch(0.87 0 0)"),
    chart5: readCssVar("--chart-5", "oklch(0.269 0 0)"),
  }
}

// A row of bars ordered darkest-first reads as a hierarchy (like the
// Dimension per Apps/Category cards) — generated from the theme's dark/light
// chart tokens rather than a hardcoded scale, so it tracks --chart-1/--chart-5
// if the theme changes.
export function getGrayShades(count) {
  const { chart5, chart1 } = getThemeColors()
  const darkLightness = parseOklchLightness(chart5, 0.269)
  const lightLightness = parseOklchLightness(chart1, 0.87)

  if (count <= 1) return [chart5]

  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    const lightness = darkLightness + (lightLightness - darkLightness) * t
    return `oklch(${lightness.toFixed(3)} 0 0)`
  })
}

function parseOklchLightness(value, fallback) {
  const match = /oklch\(\s*([\d.]+)/.exec(value)
  return match ? Number(match[1]) : fallback
}

// Tailwind's published color scale (900 -> 400), used to give each chart its
// own hue instead of the theme's neutral grayscale — canonical Tailwind
// values, not invented colors.
export const TAILWIND_SHADES = {
  blue: ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"],
  violet: ["#4c1d95", "#6d28d9", "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd"],
  indigo: ["#312e81", "#3730a3", "#4338ca", "#4f46e5", "#6366f1", "#818cf8"],
  teal: ["#134e4a", "#115e59", "#0f766e", "#0d9488", "#14b8a6", "#2dd4bf"],
  emerald: ["#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399"],
  rose: ["#881337", "#9f1239", "#be123c", "#e11d48", "#f43f5e", "#fb7185"],
}

// Darkest-first shades for a named Tailwind hue, sized to `count` rows (bar
// hierarchies like Dimension per App/Category).
export function getTailwindShades(name, count) {
  const scale = TAILWIND_SHADES[name] ?? TAILWIND_SHADES.blue
  if (count <= scale.length) return scale.slice(0, count)
  return Array.from({ length: count }, (_, i) => scale[Math.min(i, scale.length - 1)])
}
