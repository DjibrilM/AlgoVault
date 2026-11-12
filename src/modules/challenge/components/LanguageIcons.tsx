import * as React from 'react'
import type { SupportedLang } from '../types'

import typescriptImg from '@/assets/images/programming-languages/typescript.png'
import pythonImg from '@/assets/images/programming-languages/python.png'
import jsImg from '@/assets/images/programming-languages/js.png'
import cppImg from '@/assets/images/programming-languages/c-.png'

export { typescriptImg, pythonImg, jsImg, cppImg }

export function TypeScriptIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <img
      src={typescriptImg}
      alt="TypeScript"
      className={`${className} object-contain inline-block shrink-0`}
      draggable={false}
    />
  )
}

export function PythonIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <img
      src={pythonImg}
      alt="Python"
      className={`${className} object-contain inline-block shrink-0`}
      draggable={false}
    />
  )
}

export function JavaScriptIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <img
      src={jsImg}
      alt="JavaScript"
      className={`${className} object-contain inline-block shrink-0`}
      draggable={false}
    />
  )
}

export function CppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <img
      src={cppImg}
      alt="C++"
      className={`${className} object-contain inline-block shrink-0`}
      draggable={false}
    />
  )
}

export function ReactIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="-11.5 -10.23174 23 20.46348" className={className}>
      <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  )
}

export interface LanguageConfig {
  id: SupportedLang
  fileName: string
  label: string
  imageSrc: string
  Icon: React.ComponentType<{ className?: string }>
}

export const LANGUAGES: LanguageConfig[] = [
  {
    id: 'typescript',
    fileName: 'solution.ts',
    label: 'TypeScript',
    imageSrc: typescriptImg,
    Icon: TypeScriptIcon,
  },
  {
    id: 'python',
    fileName: 'solution.py',
    label: 'Python 3',
    imageSrc: pythonImg,
    Icon: PythonIcon,
  },
  {
    id: 'javascript',
    fileName: 'solution.js',
    label: 'JavaScript',
    imageSrc: jsImg,
    Icon: JavaScriptIcon,
  },
  {
    id: 'cpp',
    fileName: 'solution.cpp',
    label: 'C++ 20',
    imageSrc: cppImg,
    Icon: CppIcon,
  },
]
