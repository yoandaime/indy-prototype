import { createContext, useContext, useEffect, useState } from "react"

const AccessContext = createContext(null)
const STORAGE_KEY = "indy-access-role"

function readStoredRole() {
  if (typeof window === "undefined") return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === "admin" || value === "user" ? value : null
}

export function AccessProvider({ children }) {
  const [role, setRole] = useState(readStoredRole)

  useEffect(() => {
    if (role) {
      window.localStorage.setItem(STORAGE_KEY, role)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [role])

  return <AccessContext.Provider value={{ role, setRole }}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error("useAccess must be used within an AccessProvider")
  return ctx
}
