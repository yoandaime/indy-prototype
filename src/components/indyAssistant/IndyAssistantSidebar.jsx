import { MessageCirclePlus, PanelLeft } from "lucide-react"
import IndyAssistantBrand from "@/components/indyAssistant/IndyAssistantBrand"
import { cn } from "@/lib/utils"

export default function IndyAssistantSidebar({ history, activeId, onSelect, onNewChat, onCollapse }) {
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col gap-4 border-r border-neutral-200 bg-white p-4">
      <div className="flex w-full items-center justify-between">
        <IndyAssistantBrand />
        <button
          type="button"
          aria-label="Collapse sidebar"
          onClick={onCollapse}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
        >
          <PanelLeft className="size-3.5" />
        </button>
      </div>

      <div className="flex w-full flex-col items-start gap-0.5">
        <button
          type="button"
          onClick={onNewChat}
          className="flex h-8 w-full items-center gap-2 rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          <MessageCirclePlus className="size-4 shrink-0" />
          New Chat
        </button>

        {history.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-md px-3 py-1 text-left text-sm text-neutral-600 hover:bg-neutral-100",
              activeId === conv.id && "bg-black/5 font-medium text-black hover:bg-black/5"
            )}
          >
            <span className="min-w-0 flex-1 truncate">{conv.title}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
