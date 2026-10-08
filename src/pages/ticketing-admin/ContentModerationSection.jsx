import { useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ContentModerationTicketCard from "@/components/ticketing/ContentModerationTicketCard"
import { STATUS } from "@/data/ticketingData"

export default function ContentModerationSection() {
  const { tickets, setTickets, pinnedIds, setPinnedIds } = useOutletContext()
  const [tab, setTab] = useState("all")
  const [picPopoverOpen, setPicPopoverOpen] = useState(false)

  const filtered = useMemo(() => {
    if (tab === "pinned") return tickets.filter((t) => pinnedIds.includes(t.id))
    if (tab === "solved") return tickets.filter((t) => t.status === STATUS.solved)
    return tickets
  }, [tickets, pinnedIds, tab])

  const pinnedCount = tickets.filter((t) => pinnedIds.includes(t.id)).length
  const solvedCount = tickets.filter((t) => t.status === STATUS.solved).length

  const togglePin = (id) => {
    setPinnedIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]))
  }

  const toggleSolved = (ticket) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id ? { ...t, status: t.status === STATUS.solved ? STATUS.open : STATUS.solved } : t
      )
    )
  }

  const handleDelete = (id) => {
    setTickets((prev) => prev.filter((t) => t.id !== id))
    setPinnedIds((prev) => prev.filter((pid) => pid !== id))
  }

  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      {picPopoverOpen && (
        <div className="fixed inset-0 z-40" onClick={(e) => e.stopPropagation()} />
      )}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Content Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Pin important threads to the top, mark threads as solved, or securely delete content.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="pinned">Pinned ({pinnedCount})</TabsTrigger>
          <TabsTrigger value="solved">Solved ({solvedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4.5">
        {filtered.map((ticket) => {
          const isPinned = pinnedIds.includes(ticket.id)
          const isSolved = ticket.status === STATUS.solved
          return (
            <ContentModerationTicketCard
              key={ticket.id}
              ticket={ticket}
              isPinned={isPinned}
              isSolved={isSolved}
              onTogglePin={() => togglePin(ticket.id)}
              onToggleSolved={() => toggleSolved(ticket)}
              onDelete={() => handleDelete(ticket.id)}
              onPicPopoverOpenChange={setPicPopoverOpen}
            />
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center text-sm text-muted-foreground">
            No tickets in this view.
          </div>
        )}
      </div>
    </div>
  )
}
