import { Select as SelectPrimitive } from '@base-ui/react/select'
import { CaretDown } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

function SelectRoot<TValue, TMultiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<TValue, TMultiple>,
) {
  return <SelectPrimitive.Root<TValue, TMultiple> {...props} />
}

const Select = SelectRoot

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm whitespace-nowrap transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
        <CaretDown size={16} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value {...props} />
}

function SelectPopup({ className, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner>
        <SelectPrimitive.Popup
          className={cn(
            'z-[60] max-h-60 min-w-32 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md data-[ending-style]:fade-out data-[starting-style]:fade-in data-[ending-style]:zoom-out data-[starting-style]:zoom-in data-[ending-style]:animate-out data-[starting-style]:animate-in data-[ending-style]:duration-100 data-[starting-style]:duration-100',
            className,
          )}
          {...props}
        />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectList({ className, ...props }: SelectPrimitive.List.Props) {
  return (
    <SelectPrimitive.List
      className={cn('flex flex-col gap-0.5', className)}
      {...props}
    />
  )
}

function SelectItem({ className, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function SelectItemText({
  className,
  ...props
}: SelectPrimitive.ItemText.Props) {
  return (
    <SelectPrimitive.ItemText
      className={cn('flex-1 truncate', className)}
      {...props}
    />
  )
}

function SelectItemIndicator({
  className,
  ...props
}: SelectPrimitive.ItemIndicator.Props) {
  return (
    <SelectPrimitive.ItemIndicator
      className={cn('absolute right-2 flex items-center', className)}
      {...props}
    />
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      className={cn('flex flex-col', className)}
      {...props}
    />
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup as SelectContent,
  SelectList,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectGroup,
  SelectLabel,
}
