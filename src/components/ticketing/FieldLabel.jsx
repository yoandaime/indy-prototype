import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function FieldLabel({ htmlFor, required, className, children }) {
  return (
    <Label htmlFor={htmlFor} className={cn("gap-0", className)}>
      {children}
      {required && <span className="ml-px text-destructive">*</span>}
    </Label>
  )
}
