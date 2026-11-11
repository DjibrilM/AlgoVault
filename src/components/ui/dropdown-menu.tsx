"use client"

import * as React from "react"
import { Menu } from "@base-ui/react/menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenu = Menu.Root

const DropdownMenuTrigger = Menu.Trigger

const DropdownMenuGroup = Menu.Group

const DropdownMenuPortal = Menu.Portal

const DropdownMenuSub = Menu.SubmenuRoot

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: Menu.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <Menu.SubmenuTrigger
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none focus:bg-[#2A2A2A] focus:text-white data-[state=open]:bg-[#2A2A2A]",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-3.5 w-3.5" />
    </Menu.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  sideOffset = 4,
  alignOffset = -4,
  children,
  ...props
}: Menu.Popup.Props & {
  sideOffset?: number
  alignOffset?: number
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={sideOffset} alignOffset={alignOffset} className="z-50">
        <Menu.Popup
          className={cn(
            "dropdown-menu-popup z-50 min-w-32 overflow-hidden rounded-md border border-[#2E2E2E] bg-[#1E1E1E] p-1 text-[#E5E5E5] shadow-2xl outline-none select-none",
            className
          )}
          {...props}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

function DropdownMenuContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  children,
  ...props
}: Menu.Popup.Props & {
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="z-50"
      >
        <Menu.Popup
          className={cn(
            "dropdown-menu-popup z-50 min-w-60 overflow-hidden rounded-md border border-[#2E2E2E] bg-[#1E1E1E] p-1.5 text-[#E5E5E5] shadow-2xl outline-none select-none",
            className
          )}
          {...props}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: Menu.Item.Props & {
  inset?: boolean
}) {
  return (
    <Menu.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-[#2A2A2A] hover:text-white focus:bg-[#2A2A2A] focus:text-white data-[highlighted]:bg-[#2A2A2A] data-[highlighted]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: Menu.CheckboxItem.Props) {
  return (
    <Menu.CheckboxItem
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-xs outline-none transition-colors hover:bg-[#2A2A2A] hover:text-white focus:bg-[#2A2A2A] focus:text-white data-[highlighted]:bg-[#2A2A2A] data-[highlighted]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Menu.CheckboxItemIndicator>
          <Check className="h-3.5 w-3.5" />
        </Menu.CheckboxItemIndicator>
      </span>
      {children}
    </Menu.CheckboxItem>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: Menu.RadioItem.Props) {
  return (
    <Menu.RadioItem
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-xs outline-none transition-colors hover:bg-[#2A2A2A] hover:text-white focus:bg-[#2A2A2A] focus:text-white data-[highlighted]:bg-[#2A2A2A] data-[highlighted]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Menu.RadioItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </Menu.RadioItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: Menu.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <Menu.GroupLabel
      className={cn(
        "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#737373] border-b border-[#2A2A2A] mb-1",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: Menu.Separator.Props) {
  return (
    <Menu.Separator
      className={cn("-mx-1 my-1 h-px bg-[#2E2E2E]", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-[10px] tracking-widest text-[#737373]", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
}
