import { useNavigate } from "react-router-dom"
import { ShieldCheck, User } from "lucide-react"
import indyLogo from "@/assets/indy-logo.svg"
import { useAccess } from "@/context/AccessContext"

const ACCESS_OPTIONS = [
  {
    role: "admin",
    title: "Enter as Admin",
    description: "Full access to platform administration, user management, and configuration.",
    icon: ShieldCheck,
  },
  {
    role: "user",
    title: "Enter as User",
    description: "Access your subscriptions, tables, and reports without admin controls.",
    icon: User,
  },
]

export default function PortalPage() {
  const navigate = useNavigate()
  const { setRole } = useAccess()

  const handleSelect = (role) => {
    setRole(role)
    navigate("/ticketing")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-neutral-50 px-6 py-10">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-light text-foreground">Welcome to</h1>
          <img src={indyLogo} alt="INDY" className="h-8 w-auto" />
        </div>
        <p className="text-sm text-muted-foreground">Choose how you'd like to enter the platform.</p>
      </div>

      <div className="grid w-full max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-2">
        {ACCESS_OPTIONS.map((option) => (
          <button
            key={option.role}
            type="button"
            onClick={() => handleSelect(option.role)}
            className="group flex flex-col items-start gap-4 rounded-xl border bg-white p-6 text-left shadow-sm transition-all hover:border-neutral-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <option.icon className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base leading-6 font-semibold text-foreground">{option.title}</p>
              <p className="text-sm leading-5 text-muted-foreground">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
