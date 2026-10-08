import { useState } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const SET_BY = "Admintest"

const DEFAULT_TARGETS = [
  { priority: "P0", description: "Service affecting", responseMinutes: 30, resolutionMinutes: 60, setBy: SET_BY, since: "03 Sept 2026, 19:19" },
  { priority: "P1", description: "Needs attention today", responseMinutes: 60, resolutionMinutes: 120, setBy: SET_BY, since: "03 Sept 2026, 19:18" },
  { priority: "P2", description: "Can wait", responseMinutes: 120, resolutionMinutes: 240, setBy: SET_BY, since: "03 Sept 2026, 19:19" },
]

function formatMinutes(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return "—"
  if (minutes < 60) return `${minutes}m`
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours}h` : `${Math.floor(hours)}h ${minutes % 60}m`
}

function formatNow() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`
}

export default function SlaManagementSection() {
  const [targets, setTargets] = useState(DEFAULT_TARGETS)
  const [replaceIndex, setReplaceIndex] = useState(null)
  const [responseInput, setResponseInput] = useState("")
  const [resolutionInput, setResolutionInput] = useState("")

  const activeTarget = replaceIndex != null ? targets[replaceIndex] : null
  const responseValue = Number(responseInput)
  const resolutionValue = Number(resolutionInput)
  const isValid =
    responseInput !== "" &&
    resolutionInput !== "" &&
    responseValue > 0 &&
    resolutionValue > 0 &&
    resolutionValue >= responseValue

  const openReplace = (index) => {
    setReplaceIndex(index)
    setResponseInput("")
    setResolutionInput("")
  }

  const closeReplace = () => {
    setReplaceIndex(null)
  }

  const handleReplace = () => {
    if (!isValid) return
    setTargets((prev) =>
      prev.map((t, i) =>
        i === replaceIndex
          ? {
              ...t,
              responseMinutes: responseValue,
              resolutionMinutes: resolutionValue,
              setBy: "Admin Test",
              since: formatNow(),
            }
          : t
      )
    )
    closeReplace()
  }

  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">SLA Management</h1>
        <p className="text-sm text-muted-foreground">
          Response and resolution targets per priority. Setting a target replaces the current one and keeps the old
          value in history, because tickets stay attached to the SLA they were raised under.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <Table>
          <TableHeader>
            <TableRow className="h-9 border-neutral-200 bg-neutral-100 hover:bg-neutral-100">
              <TableHead className="text-sm font-medium text-neutral-600">Priority</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">Description</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">Response</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">Resolution</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">Set by</TableHead>
              <TableHead className="text-sm font-medium text-neutral-600">Since</TableHead>
              <TableHead className="text-center text-sm font-medium text-neutral-600">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets.map((t, index) => (
              <TableRow key={t.priority} className="border-neutral-200">
                <TableCell className="text-sm font-semibold text-foreground">{t.priority}</TableCell>
                <TableCell className="text-sm text-foreground">{t.description}</TableCell>
                <TableCell className="text-sm text-foreground">{formatMinutes(t.responseMinutes)}</TableCell>
                <TableCell className="text-sm text-foreground">{formatMinutes(t.resolutionMinutes)}</TableCell>
                <TableCell className="text-sm text-foreground">{t.setBy}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.since}</TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="sm" onClick={() => openReplace(index)}>
                    Replace
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={replaceIndex != null} onOpenChange={(open) => !open && closeReplace()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Replace the {activeTarget?.priority} SLA</DialogTitle>
            <DialogDescription>
              The current targets stay attached to the tickets that used them. This adds a new active row and
              retires the old one.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Now</span>
            <span className="font-medium text-foreground">
              {formatMinutes(activeTarget?.responseMinutes)} / {formatMinutes(activeTarget?.resolutionMinutes)}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-foreground">
              {responseInput !== "" ? formatMinutes(responseValue) : "—"} /{" "}
              {resolutionInput !== "" ? formatMinutes(resolutionValue) : "—"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sla-response">
                Response, minutes<span className="text-destructive">*</span>
              </Label>
              <Input
                id="sla-response"
                type="number"
                min={1}
                value={responseInput}
                onChange={(e) => setResponseInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sla-resolution">
                Resolution, minutes<span className="text-destructive">*</span>
              </Label>
              <Input
                id="sla-resolution"
                type="number"
                min={1}
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Must be at least the response target.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeReplace}>
              Cancel
            </Button>
            <Button disabled={!isValid} onClick={handleReplace}>
              Replace SLA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
