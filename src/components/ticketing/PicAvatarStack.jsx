import { XIcon } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import WhatsAppIcon from "@/components/ticketing/WhatsAppIcon"
import { ticketAuthorInitials, ticketAuthorAvatarUrl, picPhone, waLinkFromPhone } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

const MAX_VISIBLE = 2
// Popover content height is capped to roughly fit 5 list items before it scrolls.

export default function PicAvatarStack({ pic = [], size = "sm", className, onPopoverOpenChange }) {
  if (pic.length === 0) return null

  const visible = pic.slice(0, MAX_VISIBLE)
  const overflowCount = pic.length - visible.length

  return (
    <Popover
      onOpenChange={(open, eventDetails) => {
        if (!open && eventDetails.reason === "outside-press") {
          eventDetails.cancel()
          return
        }
        onPopoverOpenChange?.(open)
      }}
    >
      <PopoverTrigger
        className={cn("cursor-pointer", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <AvatarGroup>
          {visible.map((name) => (
            <Avatar key={name} size={size}>
              {ticketAuthorAvatarUrl(name) && <AvatarImage src={ticketAuthorAvatarUrl(name)} alt={name} />}
              <AvatarFallback className="font-semibold">{ticketAuthorInitials(name)}</AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && <AvatarGroupCount>+{overflowCount}</AvatarGroupCount>}
        </AvatarGroup>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1.5">
        <div className="flex items-center justify-between px-1.5 pt-0.5">
          <span className="text-sm font-semibold text-foreground">PIC</span>
          <PopoverClose
            render={<Button variant="ghost" size="icon-sm" />}
            onClick={(e) => e.stopPropagation()}
          >
            <XIcon className="size-3.5" />
            <span className="sr-only">Close</span>
          </PopoverClose>
        </div>
        <div className="max-h-[220px] overflow-y-auto">
          {pic.map((name) => {
            const phone = picPhone(name)
            return (
              <div key={name} className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-neutral-100">
                <Avatar size="sm">
                  {ticketAuthorAvatarUrl(name) && <AvatarImage src={ticketAuthorAvatarUrl(name)} alt={name} />}
                  <AvatarFallback className="text-[10px] font-semibold">{ticketAuthorInitials(name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{name}</span>
                {phone && (
                  <a
                    href={waLinkFromPhone(phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Chat with ${name} on WhatsApp`}
                    className="shrink-0 text-emerald-600 hover:text-emerald-700"
                  >
                    <WhatsAppIcon className="size-4" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
