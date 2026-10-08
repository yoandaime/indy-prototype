import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ChatInput({ value, onChange, onSubmit, className }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-[660px] items-end gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-[11px] shadow-[0_4px_8px_-2px_rgba(10,13,18,0.1),0_2px_4px_-2px_rgba(10,13,18,0.06)]",
        className
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="type your question here..."
        rows={1}
        className="field-sizing-content min-h-[72px] max-h-[178px] flex-1 resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim()}
        aria-label="Send message"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-50 disabled:hover:bg-neutral-100"
      >
        <ArrowUp className="size-3.5" />
      </button>
    </div>
  )
}
