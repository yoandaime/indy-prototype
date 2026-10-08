import { Link } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RegisterDataPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-neutral-50 pt-10 px-10 pb-10">
      <div className="mx-auto w-full max-w-[775px] space-y-4">
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={
            <Link to="/">
              <ChevronLeft className="size-3" />
              Back to menu
            </Link>
          }
        />

        <div className="space-y-6 rounded-xl border bg-white p-8 text-center shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl leading-6 font-semibold text-foreground">
              Register New Data
            </h2>
            <p className="text-xs leading-4 text-neutral-600">
              This page is coming soon.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            The data source registration wizard will be available here in a
            future phase.
          </p>
        </div>
      </div>
    </div>
  )
}
