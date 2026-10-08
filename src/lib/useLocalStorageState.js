import { useEffect, useState } from "react"

// Persists state to localStorage and keeps it synced across browser tabs —
// used so a "user" tab and an "admin" tab (the two access roles picked at the
// entry screen) see each other's changes live, since there's no real backend
// to be the shared source of truth.
export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return typeof initialValue === "function" ? initialValue() : initialValue
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored)
    } catch {
      // Corrupt or inaccessible storage — fall back to the initial value.
    }
    return typeof initialValue === "function" ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full/unavailable — state still works in-memory for this tab.
    }
  }, [key, value])

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== key || event.newValue === null) return
      try {
        setValue(JSON.parse(event.newValue))
      } catch {
        // Ignore a malformed payload written by another tab.
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [key])

  return [value, setValue]
}
