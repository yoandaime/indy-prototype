import { useMemo, useState } from "react"
import { Search, MoreHorizontal, ListFilter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ticketAuthorInitials, ticketAuthorEmail, ticketAuthorAvatarUrl } from "@/data/ticketingData"

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
  { value: "member", label: "Member" },
]

const USERS = [
  { name: "Fengky Pratama", department: "Network Data Quality", role: "member", status: "Active", timestamp: "10 Aug 2026, 09:12" },
  { name: "Ivan Nurcahyo", department: "Network Data Quality", role: "member", status: "Active", timestamp: "10 Aug 2026, 08:40" },
  { name: "Rahadian A.", department: "Data Engineering", role: "moderator", status: "Active", timestamp: "09 Aug 2026, 17:05" },
  { name: "Dewi Kartika", department: "Data Engineering", role: "member", status: "Active", timestamp: "09 Aug 2026, 14:22" },
  { name: "Yoga Pratama", department: "Data Platform", role: "member", status: "Suspended", timestamp: "05 Aug 2026, 11:18" },
  { name: "Nabila Putri", department: "Network Data Quality", role: "member", status: "Active", timestamp: "08 Aug 2026, 10:03" },
  { name: "Bramantyo Adi", department: "Data Platform", role: "moderator", status: "Active", timestamp: "07 Aug 2026, 16:47" },
  { name: "Siti Nurhaliza", department: "Data Engineering", role: "admin", status: "Active", timestamp: "06 Aug 2026, 09:55" },
]

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label]))

function StatusPill({ status }) {
  return (
    <Badge variant={status === "Active" ? "secondary" : "destructive"} className="rounded-md">
      {status}
    </Badge>
  )
}

export default function ManageUsersSection() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return USERS.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        ticketAuthorEmail(u.name).toLowerCase().includes(q)
      )
    })
  }, [search, roleFilter])

  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-sm font-semibold text-foreground">User Management</h1>
              <p className="text-xs text-muted-foreground">
                Manage access roles, approve new members, or suspend problematic accounts.
              </p>
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Users: {USERS.length}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-[320px] shrink-0">
              <Input
                placeholder="Search by name, @username, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pr-8 font-normal shadow-xs"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger size="sm" className="w-fit shadow-xs">
                <ListFilter className="size-4 text-muted-foreground" />
                <SelectValue>{(value) => ROLE_LABELS[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <Table>
              <TableHeader>
                <TableRow className="h-9 border-neutral-200 bg-neutral-100 hover:bg-neutral-100">
                  <TableHead className="text-sm font-medium text-neutral-600">User</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Email</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Department</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Role</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Status</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Timestamps</TableHead>
                  <TableHead className="text-sm font-medium text-neutral-600">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.name} className="border-neutral-200">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          {ticketAuthorAvatarUrl(u.name) && (
                            <AvatarImage src={ticketAuthorAvatarUrl(u.name)} alt={u.name} />
                          )}
                          <AvatarFallback className="font-semibold">{ticketAuthorInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ticketAuthorEmail(u.name)}</TableCell>
                    <TableCell className="text-sm text-foreground">{u.department}</TableCell>
                    <TableCell className="text-sm text-foreground capitalize">{u.role}</TableCell>
                    <TableCell>
                      <StatusPill status={u.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.timestamp}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
