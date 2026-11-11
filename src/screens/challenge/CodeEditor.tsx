"use client"

import { useState, useEffect } from 'react'
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Problem } from './mockData'
import {
  LANGUAGES,
  SupportedLang,
} from './LanguageIcons'

// Export all dropdown menu components so they remain readily available
export {
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
}

interface CodeEditorProps {
  problem: Problem
  code: string
  onChangeCode: (newCode: string) => void
  onRun: () => void
  onSubmit: () => void
  isRunning: boolean
  selectedLang?: SupportedLang
  onSelectLang?: (lang: SupportedLang) => void
}

export function CodeEditor({
  problem,
  code,
  onChangeCode,
  onRun,
  onSubmit,
  isRunning,
  selectedLang: externalLang,
  onSelectLang,
}: CodeEditorProps) {
  const [internalLang, setInternalLang] = useState<SupportedLang>('typescript')
  const selectedLang = externalLang ?? internalLang
  const setSelectedLang = onSelectLang ?? setInternalLang

  const [copied, setCopied] = useState(false)

  // When problem or language changes, load default template if empty
  useEffect(() => {
    const template = problem.codeTemplates[selectedLang] || ''
    onChangeCode(template)
  }, [problem.id, selectedLang])

  const handleReset = () => {
    const template = problem.codeTemplates[selectedLang] || ''
    onChangeCode(template)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lineCount = Math.max(1, code.split('\n').length)
  const currentLangConfig =
    LANGUAGES.find((l) => l.id === selectedLang) || LANGUAGES[0]
  const CurrentIcon = currentLangConfig.Icon

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E] text-[#E5E5E5] overflow-hidden select-none">
      {/* VS Code Style Editor Tab Bar */}
      <div className="h-10 bg-[#181818] border-b border-[#262626] flex items-stretch justify-between shrink-0 select-none">
        {/* Active File Tab with DropdownMenu Language Picker (No close button) */}
        <div className="relative h-full flex items-stretch">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-full rounded-none border-0 border-r border-[#262626] bg-[#1E1E1E] text-white border-t-2 border-t-[#007ACC] hover:bg-[#232323] hover:text-white px-3.5 gap-2 font-normal cursor-pointer select-none"
                  title="Click to switch language"
                >
                  <CurrentIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono text-xs font-medium">{currentLangConfig.fileName}</span>
                  <ChevronDown className="h-3 w-3 text-[#8C8C8C] group-hover:text-white transition-transform duration-150" />
                </Button>
              }
            />

            <DropdownMenuContent className="w-64" align="start">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Languages</DropdownMenuLabel>
                {LANGUAGES.map((lang) => {
                  const isActive = selectedLang === lang.id
                  const IconComponent = lang.Icon

                  return (
                    <DropdownMenuItem
                      key={lang.id}
                      onClick={() => setSelectedLang(lang.id)}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComponent className="h-4 w-4 shrink-0" />
                        <span className="font-medium text-xs">{lang.label}</span>
                        <span className="font-mono text-[11px] text-[#737373]">
                          ({lang.fileName})
                        </span>
                      </div>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 text-[#007ACC]" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Editor Quick Action Buttons */}
        <div className="flex items-center gap-1.5 px-2 bg-[#181818]">
          <button
            onClick={handleReset}
            className="p-1.5 rounded text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title="Reset code to default template"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#16A34A]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="h-4 w-px bg-[#2E2E2E] mx-1" />

          <button
            onClick={onRun}
            disabled={isRunning}
            className="h-7 px-2.5 rounded-md bg-[#262626] hover:bg-[#303030] active:scale-95 text-white text-xs font-medium flex items-center gap-1.5 border border-[#3A3A3A] transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="h-3 w-3 fill-current text-[#16A34A]" />
            <span>Run</span>
          </button>

          <button
            onClick={onSubmit}
            disabled={isRunning}
            className="h-7 px-3 rounded-md bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white text-xs font-semibold flex items-center shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* VS Code Style Breadcrumbs Bar */}
      <div className="h-6 px-3 bg-[#1E1E1E] border-b border-[#262626] flex items-center gap-1 text-[11px] text-[#737373] shrink-0 font-sans select-none overflow-hidden">
        <span className="hover:text-white cursor-pointer transition-colors">challenges</span>
        <ChevronRight className="h-3 w-3 text-[#525252] shrink-0" />
        <span className="hover:text-white cursor-pointer transition-colors truncate">
          {problem.category.toLowerCase()}
        </span>
        <ChevronRight className="h-3 w-3 text-[#525252] shrink-0" />
        <div className="flex items-center gap-1.5 text-white hover:text-white cursor-pointer transition-colors shrink-0">
          <CurrentIcon className="h-3 w-3" />
          <span className="font-mono text-[11px] font-medium">{currentLangConfig.fileName}</span>
        </div>
        <ChevronRight className="h-3 w-3 text-[#525252] shrink-0" />
        <div className="flex items-center gap-1 text-[#A3A3A3] shrink-0 font-mono">
          <span className="text-[#A855F7] font-semibold text-[10px]">class</span>
          <span className="text-white text-[11px]">Solution</span>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs relative bg-[#1E1E1E]">
        {/* Line Numbers Column */}
        <div className="w-12 py-3 pr-3 text-right bg-[#1E1E1E] text-[#525252] select-none border-r border-[#262626] shrink-0 font-mono leading-6">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Buffer */}
        <textarea
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-[#E5E5E5] resize-none outline-none font-mono leading-6 tab-4 whitespace-pre overflow-auto scrollbar-thin select-text selection:bg-[#007ACC]/40 selection:text-white"
        />
      </div>
    </div>
  )
}

export default CodeEditor
