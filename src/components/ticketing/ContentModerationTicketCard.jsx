import { useNavigate } from "react-router-dom"
import { Pin, PinOff, BadgeCheck, Circle, Trash2, ThumbsUp, MessageSquare, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/ticketing/StatusBadge"
import PriorityBadge from "@/components/ticketing/PriorityBadge"
import SlaBadge from "@/components/ticketing/SlaBadge"
import PicAvatarStack from "@/components/ticketing/PicAvatarStack"

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function Dot() {
  return <span className="size-1 shrink-0 rounded-full bg-neutral-300" />
}

export default function ContentModerationTicketCard({
  ticket,
  isPinned,
  isSolved,
  onTogglePin,
  onToggleSolved,
  onDelete,
  onPicPopoverOpenChange,
}) {
  const navigate = useNavigate()
  const goToDetail = () => navigate(`/ticketing/admin/content-moderation/${ticket.id}`)

  return (
    <div className="relative flex items-start gap-[54px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
      {isPinned && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-lg border border-teal-700 bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 shadow-xs">
          <Pin className="size-3" />
          Pinned
        </span>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={goToDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter") goToDetail()
        }}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-3.5"
      >
        <p className="line-clamp-2 text-lg leading-[27px] font-medium text-foreground">{ticket.title}</p>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <SlaBadge ticket={ticket} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-sky-600">
            {ticket.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
          <span>
            {"Author: "}
            <span className="font-medium text-foreground">{ticket.author}</span>
          </span>
          <Dot />
          <span>{formatDate(ticket.createdAt)}</span>
          <Dot />
          <span className="flex items-center gap-1">
            <ThumbsUp className="size-4" />
            {ticket.upvotes}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-4" />
            {ticket.replies.length}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-4" />
            {ticket.views}
          </span>
          {ticket.pic.length > 0 && (
            <>
              <Dot />
              <PicAvatarStack pic={ticket.pic} onPopoverOpenChange={onPicPopoverOpenChange} />
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Button
          variant={isPinned ? "outline" : "secondary"}
          size="sm"
          onClick={onTogglePin}
          className={isPinned ? "border-teal-700 bg-teal-100 text-teal-700 hover:bg-teal-100 hover:text-teal-700" : undefined}
        >
          {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          {isPinned ? "Unpin" : "Pin"}
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleSolved}>
          {isSolved ? <Circle className="size-4" /> : <BadgeCheck className="size-4" />}
          {isSolved ? "Unmark Solved" : "Mark Solved"}
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}
