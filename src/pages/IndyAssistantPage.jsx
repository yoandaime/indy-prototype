import { useEffect, useRef, useState } from "react"
import { PanelLeft } from "lucide-react"
import IndyAssistantBrand from "@/components/indyAssistant/IndyAssistantBrand"
import IndyAssistantSidebar from "@/components/indyAssistant/IndyAssistantSidebar"
import ChatInput from "@/components/indyAssistant/ChatInput"
import ChatMessage from "@/components/indyAssistant/ChatMessage"
import {
  INDY_ASSISTANT_USER,
  INDY_ASSISTANT_HISTORY,
  getMockAssistantReply,
  titleFromMessage,
} from "@/data/indyAssistantData"
import { cn } from "@/lib/utils"

const SIDEBAR_WIDTH = 240
const RAIL_WIDTH = 52

function nextMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function IndyAssistantPage() {
  const [history, setHistory] = useState(INDY_ASSISTANT_HISTORY)
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, sending])

  const handleNewChat = () => {
    setActiveId(null)
    setMessages([])
    setInput("")
  }

  const handleSelectConversation = (id) => {
    const conv = history.find((c) => c.id === id)
    if (!conv) return
    setActiveId(id)
    setMessages(conv.messages)
    setInput("")
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || sending) return

    const userMessage = { id: nextMessageId(), role: "user", text }
    const isNewConversation = activeId === null

    let conversationId = activeId
    if (isNewConversation) {
      conversationId = `conv-${Date.now()}`
      setHistory((prev) => [{ id: conversationId, title: titleFromMessage(text), messages: [] }, ...prev])
      setActiveId(conversationId)
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSending(true)
    const sentAt = Date.now()

    setTimeout(() => {
      const assistantMessage = {
        id: nextMessageId(),
        role: "assistant",
        text: getMockAssistantReply(),
        responseTimeMs: Date.now() - sentAt,
      }
      setMessages((prev) => {
        const updated = [...prev, assistantMessage]
        setHistory((prevHistory) =>
          prevHistory.map((c) => (c.id === conversationId ? { ...c, messages: updated } : c))
        )
        return updated
      })
      setSending(false)
    }, 700)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full min-w-0 flex-1 items-start">
      <div
        className="relative h-full shrink-0 transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarOpen ? SIDEBAR_WIDTH : RAIL_WIDTH }}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-opacity duration-150 ease-in-out",
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <IndyAssistantSidebar
            history={history}
            activeId={activeId}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onCollapse={() => setSidebarOpen(false)}
          />
        </div>

        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-opacity duration-150 ease-in-out",
            sidebarOpen ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          <div
            className="flex h-full flex-col items-center border-r border-neutral-200 bg-white px-3 pt-4"
            style={{ width: RAIL_WIDTH }}
          >
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={() => setSidebarOpen(true)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
            >
              <PanelLeft className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col bg-neutral-50">
        {isEmpty ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-[30px] border-b border-neutral-200 bg-[#fcfcfc] px-36 py-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col items-center gap-1">
              <IndyAssistantBrand />
              <p className="text-[38px] font-normal tracking-[-1px] text-black">
                Hi {INDY_ASSISTANT_USER}, how can I help you?
              </p>
            </div>
            <ChatInput value={input} onChange={setInput} onSubmit={handleSend} />
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {sending && (
                  <p className="text-sm text-neutral-400">INDY Assistant is thinking…</p>
                )}
              </div>
            </div>
            <div className="flex w-full justify-center border-t border-neutral-200 bg-[#fcfcfc] px-6 py-4">
              <ChatInput value={input} onChange={setInput} onSubmit={handleSend} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
