import indyAssistantSparkle from "@/assets/indy-assistant-sparkle.svg"
import indyTextLogo from "@/assets/indy-text-logo.svg"
import { cn } from "@/lib/utils"

// INDY Assistant brand lockup — gradient sparkle + "INDY" wordmark + "Assistant",
// all inside one gradient pill (pink behind the sparkle, fading to white).
// Used both in the chat sidebar header and the empty-state hero, same size.
export default function IndyAssistantBrand({ className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 whitespace-nowrap bg-gradient-to-l from-white to-[#ffebeb] py-0.5 pr-2 pl-0.5",
        className
      )}
    >
      <img src={indyAssistantSparkle} alt="" className="size-5" />
      <img src={indyTextLogo} alt="INDY" className="h-3 w-auto" />
      <span className="font-zalando-expanded text-sm text-black">Assistant</span>
    </div>
  )
}
