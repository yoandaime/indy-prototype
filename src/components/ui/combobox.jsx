import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { ChevronsUpDownIcon, CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Single-value combobox that also accepts free text input — used when a
// field offers suggestions but shouldn't restrict the user to the list.
function Combobox({ id, value, onValueChange, options, placeholder, disabled, className }) {
  return (
    <ComboboxPrimitive.Root
      items={options}
      // Both `value` and `inputValue` are kept in sync with the same string so free
      // text survives blur/close — base-ui otherwise reverts the input to the last
      // *selected* item's label once the popup closes.
      value={value}
      onValueChange={(next) => onValueChange(next ?? "")}
      inputValue={value}
      onInputValueChange={(next) => onValueChange(next)}
      disabled={disabled}
    >
      <ComboboxPrimitive.InputGroup
        className={cn(
          "flex h-9 w-full items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <ComboboxPrimitive.Input
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <ComboboxPrimitive.Icon className="text-muted-foreground">
          <ChevronsUpDownIcon className="size-4" />
        </ComboboxPrimitive.Icon>
      </ComboboxPrimitive.InputGroup>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner className="isolate z-[120]" sideOffset={4}>
          <ComboboxPrimitive.Popup className="max-h-64 w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <ComboboxPrimitive.Empty className="px-2 py-1.5 text-xs text-muted-foreground">
              No matches — you can still use your own text.
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(option) => (
                <ComboboxPrimitive.Item
                  key={option}
                  value={option}
                  onClick={() => onValueChange(option)}
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

export { Combobox }
