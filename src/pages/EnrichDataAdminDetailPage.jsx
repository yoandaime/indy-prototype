import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ChevronLeft, Pencil } from "lucide-react"
import { ADMIN_DETAIL } from "@/data/adminConnections"
import { useAccess } from "@/context/AccessContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

function BackButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      nativeButton={false}
      render={
        <Link to="/enrich-data/admin">
          <ChevronLeft className="size-3" />
          Back
        </Link>
      }
    />
  )
}

export default function EnrichDataAdminDetailPage() {
  const { id } = useParams()
  const detail = ADMIN_DETAIL[Number(id)]
  const { role } = useAccess()
  const readOnly = role === "user"

  if (!detail) {
    return (
      <div className="h-full min-w-0 flex-1 space-y-4 overflow-y-auto bg-white pt-5 px-[140px] pb-10">
        <BackButton />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No connection found for ID "{id}".
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-w-0 flex-1 space-y-6 overflow-y-auto bg-white pt-5 px-[140px] pb-10">
      <div className="flex items-center gap-3">
        <BackButton />
        <p className="text-base font-medium text-foreground">
          Connection ID: {detail.connection.connection_id} — {detail.connection.table_name}
        </p>
      </div>

      <ConnectionSection connection={detail.connection} readOnly={readOnly} />
      <ConnectionColumnSection initialColumns={detail.columns} readOnly={readOnly} />
      <DimensionRulesSection rules={detail.dimension_rules} />

      <div className="flex w-full items-start gap-6">
        <div className="w-[476px] shrink-0 space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <ActiveTableSection initialActiveTable={detail.active_table} readOnly={readOnly} />
        </div>
        <div className="min-w-0 flex-1 space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <ScheduleSection initialSchedule={detail.schedule} readOnly={readOnly} />
        </div>
      </div>
    </div>
  )
}

function ConnectionField({ label, value, isEditing, onChange }) {
  return (
    <div className="flex w-full items-center gap-6 border-b border-muted pb-1.5">
      <div className="flex w-[100px] shrink-0 items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {isEditing ? (
        <Input className="h-7 flex-1" value={value} onChange={onChange} />
      ) : (
        <span className="text-sm text-foreground">{value}</span>
      )}
    </div>
  )
}

function ConnectionSection({ connection, readOnly }) {
  const [data, setData] = useState(connection)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(connection)

  const startEdit = () => {
    setDraft(data)
    setIsEditing(true)
  }

  const cancelEdit = () => setIsEditing(false)

  const saveEdit = () => {
    setData(draft)
    setIsEditing(false)
  }

  const row = isEditing ? draft : data
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))

  return (
    <div className="w-full space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-semibold text-foreground">Connections</h2>
        {!readOnly &&
          (isEditing ? (
            <div className="flex gap-1">
              <Button size="sm" onClick={saveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          ))}
      </div>
      <div className="flex w-full items-start gap-6">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex w-full items-center gap-6 border-b border-muted pb-1.5">
            <div className="flex w-[100px] shrink-0 items-center">
              <span className="text-sm text-muted-foreground">Connection ID</span>
            </div>
            <span className="text-sm text-foreground">{data.connection_id}</span>
          </div>
          <ConnectionField label="Category" value={row.category} isEditing={isEditing} onChange={set("category")} />
          <ConnectionField label="Table Name" value={row.table_name} isEditing={isEditing} onChange={set("table_name")} />
          <ConnectionField label="Reference" value={row.reference} isEditing={isEditing} onChange={set("reference")} />
          <div className="flex w-full items-center gap-6 border-b border-muted pb-1.5">
            <div className="flex w-[100px] shrink-0 items-center">
              <span className="text-sm text-muted-foreground">Features</span>
            </div>
            <div className="flex flex-1 flex-wrap gap-1">
              {data.features.map((f) => (
                <Badge key={f} variant="secondary" className="rounded-lg font-semibold">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <ConnectionField label="Group Apps" value={row.group_apps} isEditing={isEditing} onChange={set("group_apps")} />
          <ConnectionField label="Layer Name" value={row.layer_name} isEditing={isEditing} onChange={set("layer_name")} />
          <ConnectionField label="Control Table" value={row.control_table} isEditing={isEditing} onChange={set("control_table")} />
          <ConnectionField label="Granularity" value={row.granularity} isEditing={isEditing} onChange={set("granularity")} />
          <ConnectionField label="OLA Readiness" value={row.ola_readiness} isEditing={isEditing} onChange={set("ola_readiness")} />
        </div>
      </div>
    </div>
  )
}

function ConnectionColumnSection({ initialColumns, readOnly }) {
  const [columns, setColumns] = useState(initialColumns)
  const [editingIndex, setEditingIndex] = useState(null)
  const [draft, setDraft] = useState(null)

  const startEdit = (i) => {
    setEditingIndex(i)
    setDraft({ ...columns[i] })
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setDraft(null)
  }

  const saveEdit = (i) => {
    setColumns((prev) => prev.map((c, idx) => (idx === i ? draft : c)))
    setEditingIndex(null)
    setDraft(null)
  }

  return (
    <div className="w-full space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Connection Column</h2>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead>No</TableHead>
              <TableHead>Connection ID</TableHead>
              <TableHead>Column Name</TableHead>
              <TableHead>Type ID</TableHead>
              <TableHead>Expression ID</TableHead>
              <TableHead>Is Unique</TableHead>
              <TableHead>Is Validity</TableHead>
              {!readOnly && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map((c, i) => {
              const isEditing = !readOnly && editingIndex === i
              const row = isEditing ? draft : c
              return (
                <TableRow key={c.no}>
                  <TableCell className="text-base">{c.no}</TableCell>
                  <TableCell className="text-base">{c.connection_id}</TableCell>
                  <TableCell className="text-base">{c.column_name}</TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-24"
                      value={row.type_id ?? ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, type_id: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-24"
                      value={row.expression_id ?? ""}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, expression_id: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_uniq}
                      disabled={!isEditing}
                      onCheckedChange={(v) =>
                        setDraft((d) => ({ ...d, is_uniq: v }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_validity}
                      disabled={!isEditing}
                      onCheckedChange={(v) =>
                        setDraft((d) => ({ ...d, is_validity: v }))
                      }
                    />
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => saveEdit(i)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEdit(i)}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function DimensionRulesSection({ rules }) {
  return (
    <div className="w-full space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Dimension Rules</h2>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead>Connection ID</TableHead>
              <TableHead>Dimension</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-base">{r.connection_id}</TableCell>
                <TableCell className="text-base">{r.dimension}</TableCell>
                <TableCell className="text-base">{r.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ActiveTableSection({ initialActiveTable, readOnly }) {
  const [activeTable, setActiveTable] = useState(initialActiveTable)
  const [isEditing, setIsEditing] = useState(false)
  const [draftEnabled, setDraftEnabled] = useState(initialActiveTable.enabled)

  const startEdit = () => {
    setDraftEnabled(activeTable.enabled)
    setIsEditing(true)
  }

  const cancelEdit = () => setIsEditing(false)

  const saveEdit = () => {
    setActiveTable((prev) => ({ ...prev, enabled: draftEnabled }))
    setIsEditing(false)
  }

  return (
    <>
      <h2 className="text-base font-semibold text-foreground">Active Table</h2>
      <div className="w-full overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead>Connection ID</TableHead>
              <TableHead className="text-center">Enabled</TableHead>
              {!readOnly && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{activeTable.connection_id}</TableCell>
              <TableCell className="text-center">
                {isEditing ? (
                  <Switch checked={draftEnabled} onCheckedChange={setDraftEnabled} />
                ) : (
                  <Switch checked={activeTable.enabled} disabled />
                )}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEdit}>
                      Edit
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function ScheduleSection({ initialSchedule, readOnly }) {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(initialSchedule)

  const startEdit = () => {
    setDraft(schedule)
    setIsEditing(true)
  }

  const cancelEdit = () => setIsEditing(false)

  const saveEdit = () => {
    setSchedule(draft)
    setIsEditing(false)
  }

  return (
    <>
      <h2 className="text-base font-semibold text-foreground">Schedule</h2>
      <div className="w-full overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead>Start Time</TableHead>
              <TableHead>Connection ID</TableHead>
              <TableHead>Cron Schedule</TableHead>
              <TableHead className="text-center">Enabled</TableHead>
              {!readOnly && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                {isEditing ? (
                  <Input
                    className="h-8 w-28"
                    value={draft.start_time}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, start_time: e.target.value }))
                    }
                  />
                ) : (
                  schedule.start_time
                )}
              </TableCell>
              <TableCell>{schedule.conn_id}</TableCell>
              <TableCell>
                {isEditing ? (
                  <Input
                    className="h-8 w-40"
                    value={draft.cron_schedule}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, cron_schedule: e.target.value }))
                    }
                  />
                ) : (
                  schedule.cron_schedule
                )}
              </TableCell>
              <TableCell className="text-center">
                {isEditing ? (
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
                  />
                ) : (
                  <Switch checked={schedule.enabled} disabled />
                )}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEdit}>
                      Edit
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  )
}
