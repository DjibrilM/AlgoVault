import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MARATHON_DIR = path.resolve(__dirname, '../src/assets/images/marathons/covers')
const CATEGORY_DIR = path.resolve(__dirname, '../src/assets/images/categories/covers')

fs.mkdirSync(MARATHON_DIR, { recursive: true })
fs.mkdirSync(CATEGORY_DIR, { recursive: true })

// Color palettes inspired by the user's blue/indigo/purple banner image
const GRADIENT_PALETTES = [
  { start: '#4F46E5', mid: '#3B82F6', end: '#06B6D4', dark: '#0A0E1A', accent: '#60A5FA' }, // Electric Blue / Indigo
  { start: '#6366F1', mid: '#4338CA', end: '#2563EB', dark: '#080C16', accent: '#818CF8' }, // Deep Sapphire
  { start: '#7C3AED', mid: '#4F46E5', end: '#2563EB', dark: '#0B0A1C', accent: '#A78BFA' }, // Royal Violet-Blue
  { start: '#2563EB', mid: '#1D4ED8', end: '#1E1B4B', dark: '#060B14', accent: '#93C5FD' }, // Midnight Ocean
  { start: '#0284C7', mid: '#2563EB', end: '#4F46E5', dark: '#050D18', accent: '#38BDF8' }, // Glacier Cyan-Blue
  { start: '#3B82F6', mid: '#6366F1', end: '#9333EA', dark: '#090A18', accent: '#C084FC' }, // Nebula Blue
  { start: '#1E40AF', mid: '#3B82F6', end: '#60A5FA', dark: '#060A14', accent: '#BFDBFE' }, // Arctic Cobalt
  { start: '#4338CA', mid: '#2563EB', end: '#0D9488', dark: '#070E18', accent: '#2DD4BF' }, // Deep Teal-Blue
  { start: '#581C87', mid: '#3B82F6', end: '#1E3A8A', dark: '#090614', accent: '#A855F7' }, // Velvet Indigo
  { start: '#1E293B', mid: '#2563EB', end: '#4F46E5', dark: '#030712', accent: '#60A5FA' }, // Slate Cyber
]

function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

function generateMarathonSvg(index) {
  const seed = index * 42.195 + 7
  const p = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length]
  const angle = 25 + Math.floor(seededRandom(seed + 1) * 30)

  // Generate mountain ridge coordinates
  const peakX = 580 + Math.floor(seededRandom(seed + 2) * 120) // Peak sits on the right half
  const peakY = 55 + Math.floor(seededRandom(seed + 3) * 35)
  const leftFootX = 400 + Math.floor(seededRandom(seed + 4) * 50)
  const rightFootX = 770 + Math.floor(seededRandom(seed + 5) * 20)

  // Sub peak
  const subPeakX = peakX - 90 - Math.floor(seededRandom(seed + 6) * 40)
  const subPeakY = peakY + 35 + Math.floor(seededRandom(seed + 7) * 25)

  // Topographic lines
  let contourLines = ''
  for (let c = 0; c < 5; c++) {
    const yOffset = 80 + c * 32
    const cp1x = 200 + c * 40
    const cp1y = yOffset - 30 + Math.sin(c + seed) * 15
    const cp2x = 500 - c * 20
    const cp2y = yOffset + 25 + Math.cos(c + seed) * 15
    contourLines += `
      <path d="M 0,${yOffset} C ${cp1x},${cp1y} ${cp2x},${cp2y} 800,${yOffset - 15}"
            fill="none" stroke="url(#gridGrad)" stroke-width="1.2" stroke-dasharray="${c % 2 === 0 ? 'none' : '4,4'}" opacity="${0.22 + c * 0.08}"/>`
  }

  // Network diamond emblem (matching the blue image watermark)
  const diamondCenterX = 670 + Math.floor(seededRandom(seed + 8) * 30)
  const diamondCenterY = 120 + Math.floor(seededRandom(seed + 9) * 20)
  const diamondSize = 65 + Math.floor(seededRandom(seed + 10) * 15)

  const nodes = [
    { x: diamondCenterX, y: diamondCenterY - 32 },
    { x: diamondCenterX + 24, y: diamondCenterY - 10 },
    { x: diamondCenterX - 24, y: diamondCenterY - 10 },
    { x: diamondCenterX + 28, y: diamondCenterY + 18 },
    { x: diamondCenterX - 10, y: diamondCenterY + 22 },
    { x: diamondCenterX - 30, y: diamondCenterY + 20 },
  ]

  let nodeEdges = ''
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
      if (dist < 55) {
        nodeEdges += `<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="${p.accent}" stroke-width="1.2" opacity="0.45"/>`
      }
    }
  }

  let nodeCircles = nodes.map(n =>
    `<circle cx="${n.x}" cy="${n.y}" r="4.5" fill="${p.accent}" opacity="0.8"/>
     <circle cx="${n.x}" cy="${n.y}" r="8.5" fill="none" stroke="${p.accent}" stroke-width="1" opacity="0.35"/>`
  ).join('')

  const flagX = peakX + 2
  const flagY = peakY - 26

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240" preserveAspectRatio="xMidYMid slice">
  <defs>
    <!-- Background Gradient (Sleek deep blue / violet / indigo) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${p.start}"/>
      <stop offset="45%" stop-color="${p.mid}"/>
      <stop offset="100%" stop-color="${p.end}"/>
    </linearGradient>

    <!-- Deep Ambient Overlay -->
    <radialGradient id="ambientGlow" cx="70%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="${p.mid}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${p.dark}" stop-opacity="0.85"/>
    </radialGradient>

    <!-- Dark vignette on left for clear text readability -->
    <linearGradient id="textShade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${p.dark}" stop-opacity="0.75"/>
      <stop offset="45%" stop-color="${p.dark}" stop-opacity="0.35"/>
      <stop offset="85%" stop-color="${p.dark}" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="50%" stop-color="${p.accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08"/>
    </linearGradient>

    <linearGradient id="mountainGrad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="${p.mid}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${p.dark}" stop-opacity="0.6"/>
    </linearGradient>

    <linearGradient id="mountainSnow" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0.2"/>
    </linearGradient>

    <!-- Filter for soft neon glow -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- 1. Base Gradient Canvas -->
  <rect width="800" height="240" fill="url(#bgGrad)"/>
  <rect width="800" height="240" fill="url(#ambientGlow)"/>

  <!-- 2. Tech Grid Lines / Coordinates -->
  <g opacity="0.15">
    <line x1="0" y1="60" x2="800" y2="60" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,6"/>
    <line x1="0" y1="120" x2="800" y2="120" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,6"/>
    <line x1="0" y1="180" x2="800" y2="180" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,6"/>
    <line x1="200" y1="0" x2="200" y2="240" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,6"/>
    <line x1="400" y1="0" x2="400" y2="240" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,6"/>
    <line x1="600" y1="0" x2="600" y2="240" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,6"/>
  </g>

  <!-- 3. Topographic Elevation Curves (Marathon Trajectory) -->
  ${contourLines}

  <!-- 4. Geometric Diamond Emblem (Like user's blue image) -->
  <g transform="translate(0, 0)">
    <!-- Rotating diamond frames -->
    <rect x="${diamondCenterX - diamondSize / 2}" y="${diamondCenterY - diamondSize / 2}"
          width="${diamondSize}" height="${diamondSize}"
          fill="${p.accent}" fill-opacity="0.08"
          stroke="${p.accent}" stroke-width="1.8" stroke-opacity="0.38"
          transform="rotate(45, ${diamondCenterX}, ${diamondCenterY})"/>

    <rect x="${diamondCenterX - (diamondSize * 0.75) / 2}" y="${diamondCenterY - (diamondSize * 0.75) / 2}"
          width="${diamondSize * 0.75}" height="${diamondSize * 0.75}"
          fill="none" stroke="${p.accent}" stroke-width="1" stroke-dasharray="3,3" stroke-opacity="0.3"
          transform="rotate(45, ${diamondCenterX}, ${diamondCenterY})"/>

    <!-- Network nodes & edges inside diamond -->
    ${nodeEdges}
    ${nodeCircles}
  </g>

  <!-- 5. 3D Silhouette of the Marathon Mountain & Peak -->
  <!-- Sub peak -->
  <polygon points="${subPeakX - 80},240 ${subPeakX},${subPeakY} ${subPeakX + 70},240"
           fill="url(#mountainGrad)" opacity="0.6"/>
  <!-- Main Mountain Silhouette -->
  <polygon points="${leftFootX},240 ${peakX},${peakY} ${rightFootX},240"
           fill="url(#mountainGrad)" opacity="0.8"/>

  <!-- Mountain Snow Cap -->
  <polygon points="${peakX - 25},${peakY + 40} ${peakX - 10},${peakY + 32} ${peakX},${peakY} ${peakX + 12},${peakY + 34} ${peakX + 24},${peakY + 42}"
           fill="url(#mountainSnow)"/>

  <!-- Winding Trail leading to Summit -->
  <path d="M ${leftFootX + 40},240 Q ${peakX - 40},180 ${peakX - 10},140 T ${peakX},${peakY + 8}"
        fill="none" stroke="#FDE047" stroke-width="2" stroke-dasharray="4,4" opacity="0.75"/>

  <!-- Summit Flagpole & Waypoint Flag (from user's mountain-flag.png) -->
  <line x1="${flagX}" y1="${peakY + 8}" x2="${flagX}" y2="${flagY}"
        stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Red/Orange Summit Flag with code mark -->
  <polygon points="${flagX},${flagY} ${flagX + 22},${flagY + 8} ${flagX},${flagY + 16}"
           fill="#EF4444" stroke="#B91C1C" stroke-width="0.8"/>
  <circle cx="${flagX}" cy="${flagY}" r="3" fill="#FBBF24"/>

  <!-- Code Symbol on the Mountain flag area: </> -->
  <g transform="translate(${flagX - 18}, ${flagY - 14}) scale(0.65)" opacity="0.9">
    <rect width="48" height="20" rx="4" fill="#0F172A" fill-opacity="0.7" stroke="#60A5FA" stroke-width="1"/>
    <text x="24" y="14" fill="#FFFFFF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">&lt;/&gt;</text>
  </g>

  <!-- 6. Marathon Badge / Milestone Watermark on top right -->
  <g transform="translate(710, 26)">
    <circle cx="0" cy="0" r="16" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.2"/>
    <text x="0" y="4" fill="#FFFFFF" font-family="sans-serif" font-size="9" font-weight="700" text-anchor="middle" letter-spacing="0.5">M${(index + 1).toString().padStart(2, '0')}</text>
  </g>

  <!-- 7. Text Shade Overlay on the Left (for pristine contrast of title/subtitle) -->
  <rect width="450" height="240" fill="url(#textShade)"/>
</svg>`
}

// Generate Category Cover SVGs (Clean, elegant, mature dark engineering style)
const CATEGORY_COVERS = [
  {
    id: 'arithmetic-warmup',
    name: 'Arithmetic Warmup',
    color1: '#1E3A8A', color2: '#2563EB', color3: '#06B6D4',
    symbol: '∑ x + y',
  },
  {
    id: 'data-structures',
    name: 'Data Structures',
    color1: '#312E81', color2: '#4F46E5', color3: '#818CF8',
    symbol: '[Node] ➔',
  },
  {
    id: 'algorithms',
    name: 'Core Algorithms',
    color1: '#1E1B4B', color2: '#4338CA', color3: '#38BDF8',
    symbol: 'O(log N)',
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    color1: '#2E1065', color2: '#7C3AED', color3: '#A855F7',
    symbol: 'OPT(i, j)',
  },
  {
    id: 'graph-theory',
    name: 'Graph Theory & Trees',
    color1: '#064E3B', color2: '#0D9488', color3: '#34D399',
    symbol: 'G = (V, E)',
  },
  {
    id: 'strings-sorting',
    name: 'Strings & Parsing',
    color1: '#701A75', color2: '#A21CAF', color3: '#F472B6',
    symbol: 's[i...j]',
  },
]

function generateCategorySvg(cat, index) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="catBgGrad_${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cat.color1}"/>
      <stop offset="60%" stop-color="${cat.color2}"/>
      <stop offset="100%" stop-color="${cat.color3}"/>
    </linearGradient>
    <radialGradient id="catRadial_${index}" cx="80%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#050811" stop-opacity="0.8"/>
    </radialGradient>
    <linearGradient id="catShade_${index}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#090D16" stop-opacity="0.85"/>
      <stop offset="40%" stop-color="#090D16" stop-opacity="0.4"/>
      <stop offset="80%" stop-color="#090D16" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="800" height="240" fill="url(#catBgGrad_${index})"/>
  <rect width="800" height="240" fill="url(#catRadial_${index})"/>

  <!-- Subtle mesh grid -->
  <g opacity="0.12">
    <line x1="0" y1="60" x2="800" y2="60" stroke="#ffffff" stroke-width="1"/>
    <line x1="0" y1="120" x2="800" y2="120" stroke="#ffffff" stroke-width="1"/>
    <line x1="0" y1="180" x2="800" y2="180" stroke="#ffffff" stroke-width="1"/>
    <line x1="300" y1="0" x2="300" y2="240" stroke="#ffffff" stroke-width="1"/>
    <line x1="550" y1="0" x2="550" y2="240" stroke="#ffffff" stroke-width="1"/>
  </g>

  <!-- Large technical watermark glyph on the right -->
  <g transform="translate(620, 120)">
    <circle cx="0" cy="0" r="85" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.18"/>
    <circle cx="0" cy="0" r="60" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.25"/>
    <rect x="-45" y="-45" width="90" height="90" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.2" transform="rotate(45)"/>
    <text x="0" y="8" fill="#ffffff" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle" opacity="0.65">${cat.symbol}</text>
  </g>

  <!-- Dark readability shade -->
  <rect width="450" height="240" fill="url(#catShade_${index})"/>
</svg>`
}

// 1. Generate 100 Marathon Images
console.log('Generating 100 Marathon background images in blue/indigo mountain style...')
for (let i = 0; i < 100; i++) {
  const fileName = `marathon-${(i + 1).toString().padStart(3, '0')}.svg`
  const filePath = path.join(MARATHON_DIR, fileName)
  fs.writeFileSync(filePath, generateMarathonSvg(i), 'utf8')
}
console.log(`✔ Successfully generated 100 marathon SVGs in ${MARATHON_DIR}`)

// 2. Generate Category Covers
console.log('Generating Category Cover images...')
CATEGORY_COVERS.forEach((cat, idx) => {
  const fileName = `${cat.id}.svg`
  const filePath = path.join(CATEGORY_DIR, fileName)
  fs.writeFileSync(filePath, generateCategorySvg(cat, idx), 'utf8')
})
console.log(`✔ Successfully generated category cover SVGs in ${CATEGORY_DIR}`)

