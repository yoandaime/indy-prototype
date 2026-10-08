import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import WhatsAppIcon from "@/components/ticketing/WhatsAppIcon"
import { ticketAuthorInitials, ticketAuthorAvatarUrl, picPhone, waLinkFromPhone } from "@/data/ticketingData"
import { cn } from "@/lib/utils"

export default function PicChipList({ pic = [], className }) {
  if (pic.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {pic.map((name) => {
        const phone = picPhone(name)
        return (
          <div key={name} className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 hover:bg-neutral-200">
            <Avatar className="size-5">
              {ticketAuthorAvatarUrl(name) && <AvatarImage src={ticketAuthorAvatarUrl(name)} alt={name} />}
              <AvatarFallback className="text-[8px] font-semibold">{ticketAuthorInitials(name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs whitespace-nowrap text-foreground">{name}</span>
            {phone && (
              <a
                href={waLinkFromPhone(phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chat with ${name} on WhatsApp`}
                className="shrink-0 text-emerald-600 hover:text-emerald-700"
              >
                <WhatsAppIcon className="size-3.5" />
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
