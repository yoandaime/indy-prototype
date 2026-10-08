import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Multi-select combobox built on the base-ui Combobox in `multiple` mode —
// selected values render as removable chips inline with the search input.
function MultiSelect({ id, value = [], onValueChange, options, placeholder, disabled, className, chipClassName }) {
  const chipsRef = React.useRef(null)

  return (
    <ComboboxPrimitive.Root
      items={options}
      multiple
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <ComboboxPrimitive.Chips
        ref={chipsRef}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1 shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {value.map((item) => (
          <ComboboxPrimitive.Chip
            key={item}
            className={cn(
              "flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground",
              chipClassName?.(item)
            )}
          >
            {item}
            <ComboboxPrimitive.ChipRemove
              disabled={disabled}
              className="text-muted-foreground outline-none hover:text-foreground"
            >
              <XIcon className="size-3" />
            </ComboboxPrimitive.ChipRemove>
          </ComboboxPrimitive.Chip>
        ))}
        <ComboboxPrimitive.Input
          id={id}
          placeholder={value.length ? "" : placeholder}
          disabled={disabled}
          className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </ComboboxPrimitive.Chips>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner anchor={chipsRef} className="isolate z-[120]" sideOffset={4}>
          <ComboboxPrimitive.Popup className="max-h-64 w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <ComboboxPrimitive.Empty className="px-2 py-1.5 text-xs text-muted-foreground">
              No matches.
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(option) => (
                <ComboboxPrimitive.Item
                  key={option}
                  value={option}
                  className="relative flex cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {option}
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

export { MultiSelect }
