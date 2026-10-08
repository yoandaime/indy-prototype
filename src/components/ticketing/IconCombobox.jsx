import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { ChevronsUpDownIcon, CheckIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Strict pick-from-list combobox (unlike ui/combobox.jsx, it does not accept free
// text) — used for fields backed by a fixed set of suggestions, e.g. host IPs and
// table names, where an icon per option and a clear button are also needed.
export default function IconCombobox({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  icon: Icon,
  emptyText = "No matches found.",
  className,
  invalid,
}) {
  return (
    <ComboboxPrimitive.Root
      items={options}
      value={value || null}
      onValueChange={(next) => onValueChange(next ?? "")}
      disabled={disabled}
    >
      <ComboboxPrimitive.InputGroup
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-9 w-full items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
        <ComboboxPrimitive.Input
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <ComboboxPrimitive.Clear className="flex items-center text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </ComboboxPrimitive.Clear>
        <ComboboxPrimitive.Icon className="text-muted-foreground">
          <ChevronsUpDownIcon className="size-4" />
        </ComboboxPrimitive.Icon>
      </ComboboxPrimitive.InputGroup>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner className="isolate z-[120]" sideOffset={4}>
          <ComboboxPrimitive.Popup className="max-h-64 w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <ComboboxPrimitive.Empty className="px-2 py-1.5 text-xs text-muted-foreground">
              {emptyText}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(option) => (
                <ComboboxPrimitive.Item
                  key={option}
                  value={option}
                  className="relative flex cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="truncate">{option}</span>
                  <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                    <CheckIcon className="size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}
