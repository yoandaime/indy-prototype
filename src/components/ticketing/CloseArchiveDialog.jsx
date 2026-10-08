import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import FieldLabel from "@/components/ticketing/FieldLabel"

const EMPTY_FORM = { rootCause: "", suspectSystem: "", resolutionNotes: "" }

export default function CloseArchiveDialog({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState("")

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const reset = () => {
    setForm(EMPTY_FORM)
    setError("")
  }

  const handleOpenChange = (next) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (!form.rootCause.trim() || !form.suspectSystem.trim() || !form.resolutionNotes.trim()) {
      setError("Semua field wajib diisi sebelum menutup tiket.")
      return
    }
    onSubmit(form)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-6 sm:max-w-lg">
        <DialogHeader className="gap-px">
          <DialogTitle className="text-xl leading-6 font-semibold">
            Ticket Closure & Resolution Details Form
          </DialogTitle>
          <DialogDescription>
            Lengkapi detail resion agar tiket tercatat sebagai referensi di Archive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-1">
            <FieldLabel htmlFor="rca" required className="text-sm font-medium text-foreground">
              Root Cause Analysis (RCA)
            </FieldLabel>
            <Input
              id="rca"
              placeholder="e.g. Under NAS Engine Investigation"
              value={form.rootCause}
              onChange={set("rootCause")}
              className="h-9 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <FieldLabel htmlFor="suspect-system" required className="text-sm font-medium text-foreground">
              Suspect System / Pipeline
            </FieldLabel>
            <Input
              id="suspect-system"
              placeholder="e.g. Data Quality Completeness"
              value={form.suspectSystem}
              onChange={set("suspectSystem")}
              className="h-9 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <FieldLabel
              htmlFor="resolution-notes"
              required
              className="text-sm font-medium text-foreground"
            >
              Keterangan Solusi yang Detail (Resolution)
            </FieldLabel>
            <Textarea
              id="resolution-notes"
              placeholder="Type your message here."
              value={form.resolutionNotes}
              onChange={set("resolutionNotes")}
              className="min-h-[73px] shadow-xs"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-start justify-end gap-3">
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
            <Button onClick={handleSubmit}>Simpan Solusi & Tutup Tiket</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
