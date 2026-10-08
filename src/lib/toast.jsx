import { CircleCheck } from "lucide-react"
import { toast } from "sonner"

export function notifySuccess(title, description) {
  toast.success(<span className="font-medium text-emerald-700">{title}</span>, {
    description,
    icon: <CircleCheck className="size-4 text-emerald-700" />,
  })
}
