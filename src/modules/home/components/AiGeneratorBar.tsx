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
      className="relative flex items-center gap-2 p-1.5 rounded-2xl bg-[#141414] border border-[#2E2E2E] shadow-lg focus-within:border-[#6366F1] transition-all"
    >
      <div className="pl-3 text-[#6366F1]">
        <Wand2 className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask AI to generate a question set (e.g. '5 questions on Graph Traversal and BFS')..."
        className="flex-1 h-9 bg-transparent text-xs text-white placeholder:text-[#525252] outline-none"
      />
      <button
        type="submit"
        className="px-4 h-9 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
      >
        <Wand2 className="h-3.5 w-3.5" />
        <span>Generate</span>
      </button>
    </form>
  )
}
