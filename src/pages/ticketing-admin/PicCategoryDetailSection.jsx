import { useMemo, useState } from "react"
import { useOutletContext, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MultiSelect } from "@/components/ui/multi-select"
import WhatsAppIcon from "@/components/ticketing/WhatsAppIcon"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ticketAuthorInitials, ticketAuthorEmail, ticketAuthorAvatarUrl, picPhone, waLinkFromPhone } from "@/data/ticketingData"
import { LEVEL_META, ALL_PEOPLE } from "@/data/picCategoryData"

export default function PicCategoryDetailSection() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { picCategories, setPicCategories } = useOutletContext()
  const category = picCategories.find((c) => c.id === id)

  const [editOpen, setEditOpen] = useState(false)
  const [editLevel, setEditLevel] = useState(0)
  const [editValue, setEditValue] = useState([])

  const [waOpen, setWaOpen] = useState(false)
  const [waName, setWaName] = useState(null)
  const [waPhone, setWaPhone] = useState("")
  const [phoneOverrides, setPhoneOverrides] = useState({})

  if (!category) {
    return (
      <div className="w-full flex-1 space-y-4.5 bg-white p-8">
        <p className="text-sm text-muted-foreground">Category not found.</p>
      </div>
    )
  }

  const levelAssignees = (levelKey) => category[levelKey]

  const openEdit = (levelIndex) => {
    setEditLevel(levelIndex)
    setEditValue(levelAssignees(LEVEL_META[levelIndex].key))
    setEditOpen(true)
  }

  const changeEditLevel = (levelIndex) => {
    setEditLevel(levelIndex)
    setEditValue(levelAssignees(LEVEL_META[levelIndex].key))
  }

  const handleSave = () => {
    const key = LEVEL_META[editLevel].key
    setPicCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, [key]: editValue } : c)))
    setEditOpen(false)
  }

  const phoneFor = (name) => phoneOverrides[name] ?? picPhone(name)

  const openWhatsApp = (name) => {
    setWaName(name)
    setWaPhone(phoneFor(name) ?? "")
    setWaOpen(true)
  }

  const handleSaveWhatsApp = () => {
    setPhoneOverrides((prev) => ({ ...prev, [waName]: waPhone.trim() }))
    setWaOpen(false)
  }

  return (
    <div className="w-full flex-1 space-y-4.5 bg-white p-8">
      <button
        type="button"
        onClick={() => navigate("/ticketing/admin/pic-category")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All categories
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{category.name}</h1>
          <p className="text-sm text-muted-foreground">
            Each level is saved on its own. A person can hold only one level per category.
          </p>
        </div>
        <Button onClick={() => openEdit(0)}>
          <Pencil className="size-4" />
          Edit PICs
        </Button>
      </div>

      <div className="space-y-4">
        {LEVEL_META.map((level, index) => {
          const assignees = levelAssignees(level.key)
          return (
            <div key={level.key} className="rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {level.label} <span className="font-normal text-muted-foreground">{assignees.length} assigned</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(index)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </div>

              {assignees.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Nobody assigned at this level.</p>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {assignees.map((name) => {
                    const phone = phoneFor(name)
                    return (
                      <div key={name} className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            {ticketAuthorAvatarUrl(name) && <AvatarImage src={ticketAuthorAvatarUrl(name)} alt={name} />}
                            <AvatarFallback className="font-semibold">{ticketAuthorInitials(name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">{ticketAuthorEmail(name)}</p>
                          </div>
                          {phone && (
                            <a
                              href={waLinkFromPhone(phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Chat with ${name} on WhatsApp`}
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                            >
                              <WhatsAppIcon className="size-3.5" />
                              {phone}
                            </a>
                          )}
                        </div>
                        <Button variant="link" size="sm" onClick={() => openWhatsApp(name)}>
                          {phone ? "Edit WhatsApp" : "Add WhatsApp"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PICs</DialogTitle>
            <DialogDescription>
              Saving replaces this level's PIC list entirely — anyone removed here loses the assignment. Other
              levels are untouched.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Level*</Label>
            <div className="flex gap-1.5">
              {LEVEL_META.map((level, index) => (
                <Button
                  key={level.key}
                  type="button"
                  variant={editLevel === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeEditLevel(index)}
                >
                  {level.label} — {levelAssignees(level.key).length} assigned
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{LEVEL_META[editLevel].description}</p>
          </div>

          <div className="space-y-1.5">
            <Label>Emails</Label>
            <MultiSelect
              value={editValue}
              onValueChange={setEditValue}
              options={ALL_PEOPLE}
              placeholder="Search by name or email..."
            />
            <p className="text-xs text-muted-foreground">
              {editValue.length} currently assigned. A person can hold only one level per category.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{phoneFor(waName) ? "Edit" : "Add"} WhatsApp for {waName}</DialogTitle>
            <DialogDescription>Used to reach this PIC directly from the category page.</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="wa-phone">Phone number</Label>
            <Input
              id="wa-phone"
              placeholder="+62812345678"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWaOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWhatsApp}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
