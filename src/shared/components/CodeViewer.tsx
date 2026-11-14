import { Streamdown } from 'streamdown'
import { code as codePlugin } from '@streamdown/code'

const CODE_PLUGINS = { code: codePlugin }

interface CodeViewerProps {
  code: string
  lang?: string
  className?: string
}

export function CodeViewer({ code, lang = 'typescript', className }: CodeViewerProps) {
  const safeFence = code.includes('```') ? '````' : '```'
  const markdown = `${safeFence}${lang}\n${code}\n${safeFence}`

  return (
    <div className={className}>
      <Streamdown plugins={CODE_PLUGINS}>{markdown}</Streamdown>
    </div>
  )
}

