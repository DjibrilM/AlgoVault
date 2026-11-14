import { Wand2, ArrowRight } from 'lucide-react'

interface AiGeneratorBarProps {
  onOpenStudio: () => void
}

export function AiGeneratorBar({ onOpenStudio }: AiGeneratorBarProps) {
  return (
    <button
      type="button"
      onClick={onOpenStudio}
      className="w-full text-left relative flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#141414] border border-[#2E2E2E] hover:border-[#3D3D3D] hover:bg-[#161616] transition-all shadow-md cursor-pointer group"
    >
      <span className="flex-1 h-9 flex items-center pl-3 pr-2 text-xs text-[#666666] group-hover:text-[#8C8C8C] transition-colors truncate">
        Command AI to create challenges, marathons, or custom practice tracks...
      </span>
      <span className="px-4 h-9 rounded-lg bg-white/10 group-hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-all shrink-0">
        <Wand2 className="h-3.5 w-3.5 text-white" />
        <span>Generate</span>
        <ArrowRight className="h-3 w-3 text-white/70 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </button>
  )
}
