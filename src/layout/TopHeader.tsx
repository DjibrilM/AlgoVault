import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

interface TopHeaderProps {
  onSearch?: (query: string) => void
}

export function TopHeader({ onSearch }: TopHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    onSearch?.(val)
  }

  return (
    <header className="h-12 bg-[#141414] flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Left: macOS Traffic Lights & Nav Arrows */}
      <div className="flex items-center gap-5 w-64">
        {/* macOS Traffic Lights */}
        <div className="w-12">

        </div>

        {/* Back & Forward Arrows (Larger comfortable touch targets) */}
        <div className="flex items-center gap-1.5 text-[#A3A3A3]">
          <button
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#222222] hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Go back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <button
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#222222] hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Go forward"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Center: Search Bar Pill */}
      <div className="flex-1 mt-0.5 max-w-lg mx-auto">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={isFocused ? 'Search problems, topics, solutions...' : ''}
            className={`w-full h-8 text-xs rounded-lg bg-[#222222] border border-[#2E2E2E] hover:border-[#3D3D3D] focus:border-white/20 focus:bg-[#1A1A1A] focus:ring-1 focus:ring-white/10 text-white placeholder:text-[#525252] transition-all outline-none ${
              isFocused || searchQuery ? 'text-left pl-3.5 pr-8' : 'text-center px-4'
            }`}
          />

          {/* Centered Search Icon + Placeholder (disappears on focus or active query) */}
          {!isFocused && !searchQuery && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none text-xs">
              <Search className="h-3.5 w-3.5 text-[#737373] shrink-0" />
              <span className="text-[#525252]">Search problems, topics, solutions...</span>
            </div>
          )}

          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Spacer (matches left width for perfect center alignment) */}
      <div className="w-64" />
    </header>
  )
}

export default TopHeader
