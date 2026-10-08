import { Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import FieldSelect from "@/components/dataObservability/FieldSelect"

// Schema/Table/Describe/Period live in the shared DQ Composer aside — this
// only renders the fields specific to the Profiling sub-tab.
export default function ProfilingFields({
  describedTable,
  insertTimeColumn,
  onInsertTimeColumnChange,
  uniqKeyColumns,
  onUniqKeyColumnsChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onProfileTable,
}) {
  const allColumnNames = describedTable ? describedTable.columns.map((c) => c.column) : []

  return (
    <>
      <FieldSelect
        id="profile-insert-time"
        label="Insert Time Column (optional)"
        value={insertTimeColumn}
        onValueChange={onInsertTimeColumnChange}
        options={allColumnNames}
        placeholder="Select..."
      />

      <div className="space-y-1.5">
        <Label htmlFor="profile-uniq-keys">Uniq Key Columns — {uniqKeyColumns.length} dipilih</Label>
        <MultiSelect
          id="profile-uniq-keys"
          value={uniqKeyColumns}
          onValueChange={onUniqKeyColumnsChange}
          options={allColumnNames}
          placeholder="Cari kolom..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-start-date">Start Date</Label>
          <Input
            id="profile-start-date"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-end-date">End Date</Label>
          <Input
            id="profile-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      <Button type="button" className="w-full" onClick={onProfileTable}>
        <Activity className="size-4" />
        Profile Table
      </Button>
    </>
  )
}
