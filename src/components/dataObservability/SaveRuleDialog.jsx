import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import SqlEditor from "@/components/dataObservability/SqlEditor"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

export default function SaveRuleDialog({ open, onOpenChange, form, onPatch, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Save Rule</DialogTitle>
          <DialogDescription>Review the generic formula before adding it to Rules Catalog.</DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="save-column-name">Column Name</Label>
              <Input id="save-column-name" value={form.columnName} onChange={(e) => onPatch({ columnName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-rule-label">Rule Label</Label>
              <Input id="save-rule-label" value={form.ruleLabel} onChange={(e) => onPatch({ ruleLabel: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-description">Description</Label>
              <Textarea
                id="save-description"
                value={form.description}
                onChange={(e) => onPatch({ description: e.target.value })}
                className="field-sizing-fixed h-16 resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-templater">Query Templater</Label>
              <SqlEditor
                id="save-templater"
                value={form.queryTemplater}
                onChange={(e) => onPatch({ queryTemplater: e.target.value })}
                className="h-48"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="save-num">Num</Label>
                <SqlEditor
                  id="save-num"
                  value={form.num}
                  onChange={(e) => onPatch({ num: e.target.value })}
                  className="h-16"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="save-denom">Denom</Label>
                <SqlEditor
                  id="save-denom"
                  value={form.denom}
                  onChange={(e) => onPatch({ denom: e.target.value })}
                  className="h-16"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="save-rate">Rate</Label>
              <SqlEditor
                id="save-rate"
                value={form.rate}
                onChange={(e) => onPatch({ rate: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button type="button" onClick={onSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
