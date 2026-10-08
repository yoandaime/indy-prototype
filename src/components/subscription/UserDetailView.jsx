import { useMemo, useState } from "react"
import { ChevronRight } from "lucide-react"
import {
  getUserSubscribedTables,
  getUserEmbedKey,
  getUserKeyGeneratedMinutesAgo,
  getUserActivityLog,
  getUserProfileFields,
  formatRelativeTime,
  ROLE_OPTIONS,
} from "@/data/subscriptionAdminData"
import { ticketAuthorInitials, ticketAuthorAvatarUrl } from "@/data/ticketingData"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagRow, ActivityLogEntry } from "./shared"

function buildInitialForm(user, profileFields) {
  return {
    domainUser: profileFields.domainUser,
    name: user.name,
    email: profileFields.email,
    department: profileFields.department,
    office: profileFields.office,
    role: user.role,
  }
}

function ProfileField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

export default function UserDetailView({ user, onBack }) {
  const profileFields = useMemo(() => getUserProfileFields(user), [user])
  const [initialForm, setInitialForm] = useState(() => buildInitialForm(user, profileFields))
  const [form, setForm] = useState(initialForm)

  const tables = useMemo(() => getUserSubscribedTables(user), [user])
  const activityLog = useMemo(() => getUserActivityLog(user), [user])
  const embedKey = useMemo(() => getUserEmbedKey(user), [user])
  const generatedMinutesAgo = useMemo(() => getUserKeyGeneratedMinutesAgo(user), [user])
  const [tableSearch, setTableSearch] = useState("")

  const filteredTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return tables
    return tables.filter((table) => table.name.toLowerCase().includes(q))
  }, [tables, tableSearch])

  const isDirty = Object.keys(form).some((key) => form[key] !== initialForm[key])

  const updateField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleCancel = () => setForm(initialForm)
  const handleSave = () => setInitialForm(form)

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm">
        <button type="button" onClick={onBack} className="font-medium text-foreground">
          List User
        </button>
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium text-foreground">{user.name}</span>
      </nav>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[0.85fr_1.1fr_1.05fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarImage src={ticketAuthorAvatarUrl(user.name)} alt={user.name} />
                <AvatarFallback className="text-base font-semibold">
                  {ticketAuthorInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold text-foreground">{form.name}</p>
                <p className="text-sm text-muted-foreground">{form.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <ProfileField label="Domain user">
                <Input
                  value={form.domainUser}
                  onChange={(e) => updateField("domainUser")(e.target.value)}
                />
              </ProfileField>
              <ProfileField label="Name">
                <Input value={form.name} onChange={(e) => updateField("name")(e.target.value)} />
              </ProfileField>
              <ProfileField label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email")(e.target.value)}
                />
              </ProfileField>
              <ProfileField label="Department">
                <Input
                  value={form.department}
                  onChange={(e) => updateField("department")(e.target.value)}
                />
              </ProfileField>
              <ProfileField label="Office">
                <Input value={form.office} onChange={(e) => updateField("office")(e.target.value)} />
              </ProfileField>
              <ProfileField label="Role">
                <Select value={form.role} onValueChange={updateField("role")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ProfileField>
            </div>

            <div className="mt-auto flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={!isDirty} onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="default" size="sm" disabled={!isDirty} onClick={handleSave}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">User Subscription</CardTitle>
                <CardDescription>Total {tables.length} subscriptions</CardDescription>
              </div>
              <div className="space-y-1.5 text-right">
                <div>
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Embed Key
                  </p>
                  <p className="font-mono text-xs text-foreground" title={embedKey}>
                    {embedKey.slice(0, 18)}…
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Last Generated
                  </p>
                  <p className="text-xs text-foreground">{formatRelativeTime(generatedMinutesAgo)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            <Input
              placeholder="Search table name..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {filteredTables.map((table) => (
                <div key={table.id} className="border-b pb-2 last:border-b-0">
                  <p className="text-sm leading-tight font-medium text-foreground">{table.name}</p>
                  <TagRow
                    app={table.app}
                    category={table.category}
                    schema={table.schema}
                    granularity={table.granularity}
                  />
                </div>
              ))}
              {filteredTables.length === 0 && (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No tables match your search.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Subscription Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {activityLog.map((entry) => (
                <ActivityLogEntry key={entry.id} entry={entry} />
              ))}
              {activityLog.length === 0 && (
                <p className="py-3 text-center text-sm text-muted-foreground">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
