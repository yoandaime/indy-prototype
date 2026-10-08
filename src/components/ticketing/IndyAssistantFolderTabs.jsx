import { useLayoutEffect, useRef, useState } from "react"
import { Ellipsis, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Folder-style tab — real "paper tab" shape, traced from the actual vector
// path Figma exports for the tab background (node 548:287 for the 1st-slot
// tab, node 548:253's "Rectangle 2" for a regular slot): it's not a plain
// rounded rect — the top edge is inset and the corner flares out on a
// diagonal to meet the full-width side edge partway down, like a real
// paper tab peeling off the row. The first slot only flares on its right
// side (its left edge stays put, flush against the panel's square left
// edge); every other slot flares symmetrically on both sides.
//
// The shape (border fill + clip) lives on its own layered rectangles behind
// the label, separate from the outer button that only handles
// layout/padding — the same split Figma uses (a "Rectangle" shape layer
// under the text layer) so the geometry can be tuned without touching
// layout. Two stacked clipped layers fake a border that follows the
// diagonal (a plain CSS border can't bend with a clip shape): the outer
// layer is solid violet-600, the inner is inset 1px and filled violet-50,
// left open on the bottom edge so it merges into the panel with no seam.
//
// clip-path: polygon() only draws straight lines, which made every vertex a
// hard point — softened below by measuring each tab's real rendered size
// (px, so the corner radius stays a constant size regardless of label
// length) and building a clip-path: path() with a quadratic curve rounding
// every vertex except the two bottom corners, which stay sharp since that's
// the seam that merges into the panel below.
const TAB_FLARE = 11
const TAB_FIRST_CORNER = 4
const TAB_CORNER_RADIUS = 4

function tabPoints(width, height, isFirst) {
  const left = isFirst ? TAB_FIRST_CORNER : TAB_FLARE
  return [
    { x: left, y: 0 },
    { x: width - TAB_FLARE, y: 0 },
    { x: width, y: TAB_FLARE },
    { x: width, y: height },
    { x: 0, y: height },
    { x: 0, y: left },
  ]
}

// Bottom-right/bottom-left corners get 0 radius — see note above.
const TAB_RADII = [TAB_CORNER_RADIUS, TAB_CORNER_RADIUS, TAB_CORNER_RADIUS, 0, 0, TAB_CORNER_RADIUS]

function roundedPolygonPath(points, radii) {
  const n = points.length
  let d = ""
  for (let i = 0; i < n; i++) {
    const curr = points[i]
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y }
    const toNext = { x: next.x - curr.x, y: next.y - curr.y }
    const lenPrev = Math.hypot(toPrev.x, toPrev.y) || 1
    const lenNext = Math.hypot(toNext.x, toNext.y) || 1
    const r = Math.min(radii[i], lenPrev / 2, lenNext / 2)
    const p1 = { x: curr.x + (toPrev.x / lenPrev) * r, y: curr.y + (toPrev.y / lenPrev) * r }
    const p2 = { x: curr.x + (toNext.x / lenNext) * r, y: curr.y + (toNext.y / lenNext) * r }
    d += `${i === 0 ? "M" : "L"} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `
    d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `
  }
  return `${d}Z`
}

function tabPath(width, height, isFirst) {
  if (!width || !height) return null
  return roundedPolygonPath(tabPoints(width, height, isFirst), TAB_RADII)
}

// Same flare shape for every tab, active or not — only the fill/border
// changes: active gets the violet border + violet-50 fill (faked with two
// stacked clipped layers, since a plain border can't bend with the clip
// shape); inactive gets a single neutral-100 fill and no border.
function FolderTabShape({ isFirst, active }) {
  const ref = useRef(null)
  const [size, setSize] = useState(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!active) {
    // No -mb-px here (unlike the active shape below): an inactive tab must
    // NOT overlap into the panel, otherwise its opaque fill paints over —
    // and hides — the panel's own top border running underneath it.
    const fillPath = size && tabPath(size.width, size.height, isFirst)
    return (
      <span
        ref={ref}
        aria-hidden
        className="absolute inset-0 bg-neutral-100 transition-colors group-hover:bg-neutral-200"
        style={fillPath ? { clipPath: `path('${fillPath}')` } : undefined}
      />
    )
  }

  const outerPath = size && tabPath(size.width, size.height, isFirst)
  const innerPath = size && tabPath(Math.max(size.width - 2, 0), Math.max(size.height - 1, 0), isFirst)

  return (
    <>
      <span
        ref={ref}
        aria-hidden
        className="absolute inset-0 -mb-px bg-violet-600"
        style={outerPath ? { clipPath: `path('${outerPath}')` } : undefined}
      />
      <span
        aria-hidden
        className="absolute top-px right-px bottom-0 left-px -mb-px bg-violet-50"
        style={innerPath ? { clipPath: `path('${innerPath}')` } : undefined}
      />
    </>
  )
}

function FolderTab({ label, active, isFirst, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "group relative flex min-h-[29px] shrink-0 items-center justify-center gap-1.5 px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground transition-colors",
        !active && "hover:text-violet-700"
      )}
    >
      <FolderTabShape isFirst={isFirst} active={active} />
      <span className="relative">{label}</span>
    </button>
  )
}

const ELLIPSIS_WIDTH = 44

export default function IndyAssistantFolderTabs({ categories, activeCategory, onCategoryChange, children, className }) {
  const rowRef = useRef(null)
  const measureRefs = useRef({})
  const [visibleCount, setVisibleCount] = useState(categories.length)

  useLayoutEffect(() => {
    const el = rowRef.current
    if (!el) return

    function recompute() {
      const available = el.clientWidth
      let used = 0
      let count = 0
      for (let i = 0; i < categories.length; i++) {
        const width = measureRefs.current[categories[i].key]?.offsetWidth ?? 0
        const isLast = i === categories.length - 1
        const reserve = isLast ? 0 : ELLIPSIS_WIDTH
        if (i === 0 || used + width + reserve <= available) {
          used += width
          count = i + 1
        } else {
          break
        }
      }
      setVisibleCount(count)
    }

    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    recompute()
    return () => observer.disconnect()
  }, [categories])

  let visible = categories.slice(0, visibleCount)
  let overflow = categories.slice(visibleCount)

  const activeInVisible = visible.some((c) => c.key === activeCategory)
  if (!activeInVisible && overflow.length > 0) {
    const activeItem = categories.find((c) => c.key === activeCategory)
    if (activeItem) {
      const displaced = visible[visible.length - 1]
      visible = [...visible.slice(0, -1), activeItem]
      overflow = [displaced, ...overflow.filter((c) => c.key !== activeItem.key)]
    }
  }

  return (
    <div className={cn("relative flex w-full flex-col", className)}>
      <div ref={rowRef} role="tablist" className="relative z-[2] flex items-center">
        {visible.map((category, index) => (
          <FolderTab
            key={category.key}
            label={category.label}
            active={category.key === activeCategory}
            isFirst={index === 0}
            onClick={() => onCategoryChange?.(category.key)}
          />
        ))}

        {overflow.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="More tabs"
                  className="flex min-h-[29px] shrink-0 items-center justify-center rounded-t-md px-2 py-1 text-foreground hover:bg-neutral-200 hover:text-violet-700"
                />
              }
            >
              <Ellipsis className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflow.map((category) => (
                <DropdownMenuItem key={category.key} onClick={() => onCategoryChange?.(category.key)}>
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Off-screen measuring layer — same classes/content as real tabs so
          offsetWidth reflects actual rendered width for the overflow calc above. */}
      <div className="pointer-events-none absolute -z-10 flex h-0 items-center overflow-hidden opacity-0">
        {categories.map((category) => (
          <span
            key={category.key}
            ref={(node) => {
              measureRefs.current[category.key] = node
            }}
            className="flex shrink-0 items-center justify-center gap-1.5 border px-3 py-1 text-sm font-medium whitespace-nowrap"
          >
            {category.label}
          </span>
        ))}
      </div>

      <div className="relative z-[1] flex flex-col overflow-hidden rounded-tr-[10px] rounded-bl-[10px] rounded-br-[10px] border border-violet-600 bg-violet-50">
        <div className="p-4 text-sm text-violet-950">{children}</div>
        <div className="flex items-center gap-1 border-t border-violet-200 bg-violet-100 px-3 py-1">
          <Sparkles className="size-3 text-violet-600" />
          <p className="text-xs text-violet-800">INDY Assistant</p>
        </div>
      </div>
    </div>
  )
}
