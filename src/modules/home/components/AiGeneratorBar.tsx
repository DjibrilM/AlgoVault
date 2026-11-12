import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { AiGeneratorBarProps } from '../types'

export function AiGeneratorBar({ onSubmit }: AiGeneratorBarProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    onSubmit(prompt.trim())
    setPrompt('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center gap-2 p-1.5 rounded-xl bg-[#141414] border border-[#2E2E2E] hover:border-[#3D3D3D] focus-within:border-white/30 focus-within:bg-[#161616] transition-all shadow-md"
    >
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Generate a custom challenge set (e.g. '5 questions on Graph Traversal and BFS')..."
        className="flex-1 h-9 bg-transparent pl-3 pr-2 text-xs text-white placeholder:text-[#666666] outline-none"
      />
      <button
        type="submit"
        className="px-4 h-9 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer shrink-0"
      >
        <Wand2 className="h-3.5 w-3.5 text-white" />
        <span>Generate</span>
      </button>
    </form>
  )
}

