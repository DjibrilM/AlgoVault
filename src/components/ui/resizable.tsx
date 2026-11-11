import { GripVertical } from "lucide-react"
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels"
import { cn } from "@/lib/utils"

export interface ResizablePanelGroupProps extends Omit<GroupProps, "orientation"> {
  orientation?: "horizontal" | "vertical"
  direction?: "horizontal" | "vertical"
}

const ResizablePanelGroup = ({
  className,
  orientation = "horizontal",
  direction,
  ...props
}: ResizablePanelGroupProps) => {
  const finalOrientation = orientation || direction || "horizontal"
  return (
    <Group
      orientation={finalOrientation}
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  )
}

export interface ResizablePanelProps extends PanelProps {}

const ResizablePanel = ({
  className,
  ...props
}: ResizablePanelProps) => (
  <Panel
    className={cn(className)}
    {...props}
  />
)

export interface ResizableHandleProps extends SeparatorProps {
  withHandle?: boolean
}

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) => (
  <Separator
    className={cn(
      "relative flex items-center justify-center bg-[#262626] hover:bg-[#6366F1] transition-colors z-20 group",
      // 1px ultra-thin vertical divider
      "aria-[orientation=vertical]:w-px aria-[orientation=vertical]:cursor-col-resize aria-[orientation=vertical]:after:absolute aria-[orientation=vertical]:after:inset-y-0 aria-[orientation=vertical]:after:-left-1.5 aria-[orientation=vertical]:after:-right-1.5 aria-[orientation=vertical]:after:w-auto",
      // 1px ultra-thin horizontal divider
      "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize aria-[orientation=horizontal]:after:absolute aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:-top-1.5 aria-[orientation=horizontal]:after:-bottom-1.5 aria-[orientation=horizontal]:after:h-auto [&[aria-orientation=horizontal]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-2.5 items-center justify-center rounded-xs border border-[#333333] bg-[#1F1F1F] shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-2 w-2 text-[#A3A3A3]" />
      </div>
    )}
  </Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
