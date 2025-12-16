"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  emptyMessage = "No se encontraron resultados.",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-white" // Added bg-white to match existing inputs
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options
                .filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i)
                .map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Use label for searching if values are IDs, or value if they are same. Here values are names.
                  onSelect={(currentValue) => {
                    // cmdk returns the value in lowercase. We need to match it back to our option value.
                    // Since we passed option.label as value to CommandItem, currentValue is the label (lowercased).
                    // Actually, for this specific case where value=label (names), it's easier.
                    // But to be safe:
                    const originalOption = options.find((opt) => opt.label.toLowerCase() === currentValue.toLowerCase())
                    onChange(originalOption ? originalOption.value : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
