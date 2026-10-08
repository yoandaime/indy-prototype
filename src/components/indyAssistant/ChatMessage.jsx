import { useState } from "react"
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import { MarkdownLite } from "@/lib/markdownLite"
import { formatResponseTime } from "@/data/indyAssistantData"
import DataQualityStatCards from "@/components/indyAssistant/DataQualityStatCards"
import DataQualityTable from "@/components/indyAssistant/DataQualityTable"
import { cn } from "@/lib/utils"

function ActionButton({ active, activeClassName, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
        active && activeClassName,
        className
      )}
      {...props}
    />
  )
}

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState(null)

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900">
          {message.text}
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text)
    } catch {
      // ignore clipboard errors
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex min-w-0 w-full flex-col items-start gap-2">
      <div className="w-full min-w-0 space-y-3 text-sm text-neutral-900">
        <MarkdownLite text={message.text} />
        {message.stats && <DataQualityStatCards items={message.stats} />}
        {message.table && <DataQualityTable columns={message.table.columns} rows={message.table.rows} />}
        {message.followUp && <p className="leading-6">{message.followUp}</p>}
      </div>
      <div className="flex items-center gap-0.5">
        <ActionButton aria-label="Copy response" onClick={handleCopy}>
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </ActionButton>
        <ActionButton
          aria-label="Good response"
          active={reaction === "up"}
          activeClassName="text-emerald-600"
          onClick={() => setReaction((r) => (r === "up" ? null : "up"))}
        >
          <ThumbsUp className="size-3.5" />
        </ActionButton>
        <ActionButton
          aria-label="Bad response"
          active={reaction === "down"}
          activeClassName="text-red-600"
          onClick={() => setReaction((r) => (r === "down" ? null : "down"))}
        >
          <ThumbsDown className="size-3.5" />
        </ActionButton>
        {formatResponseTime(message.responseTimeMs) && (
          <span className="pl-1 text-xs text-neutral-400">{formatResponseTime(message.responseTimeMs)}</span>
        )}
      </div>
    </div>
  )
}
