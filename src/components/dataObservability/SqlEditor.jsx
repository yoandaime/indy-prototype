import { useRef } from "react"
import SqlCodeBlock from "@/components/dataObservability/SqlCodeBlock"
import { cn } from "@/lib/utils"

// Editable textarea with SQL syntax highlighting: a non-interactive <pre>
// (rendered via SqlCodeBlock) sits behind a transparent-text textarea, and
// scroll position is synced on every textarea scroll event.
export default function SqlEditor({ id, value, onChange, className }) {
  const preRef = useRef(null)

  function handleScroll(e) {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop
      preRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-input bg-neutral-50", className)}>
      <pre
        ref={preRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-0 overflow-hidden px-2.5 py-2 font-mono text-xs whitespace-pre text-neutral-700"
      >
        <SqlCodeBlock code={value || ""} />
      </pre>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        spellCheck={false}
        wrap="off"
        className="absolute inset-0 resize-none overflow-auto bg-transparent px-2.5 py-2 font-mono text-xs whitespace-pre text-transparent caret-neutral-900 outline-none"
      />
    </div>
  )
}
