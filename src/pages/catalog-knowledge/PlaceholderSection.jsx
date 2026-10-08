import { Construction } from "lucide-react"

export default function PlaceholderSection({ title }) {
  return (
    <div className="h-full min-w-0 flex-1 overflow-y-auto bg-neutral-50 px-10 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-3 rounded-xl border bg-white p-10 text-center shadow-sm">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
          <Construction className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl leading-6 font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">Under development.</p>
        </div>
      </div>
    </div>
  )
}
