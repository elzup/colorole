// README の「色の一覧」と見本 SVG (docs/swatches/) を正本から作る。手で書くと値がずれるので、ここ以外で hex を README に書かない
//   node src/gen-readme.ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { GROUPS, type CoreGroup, memberSlug } from './groups.ts'
import { type Role, THEMES } from './dictionary.ts'
import { contrast } from './color.ts'
import { dictFor, EXPORT_DEFAULTS } from './export.ts'

const README = new URL('../README.md', import.meta.url)
const SWATCH_DIR = new URL('../docs/swatches/', import.meta.url)
const BEGIN = '<!-- @@COLORS:BEGIN (node src/gen-readme.ts が生成。手で編集しない) -->'
const END = '<!-- @@COLORS:END -->'

// 見本の地は Blueprint / Whiteprint の地 (core 色はこの 2 つを想定して選ぶ)
const SAMPLE_BG = { dark: dictFor(THEMES[0], null).bg, light: dictFor(THEMES[1], null).bg }
const CELL = { w: 64, h: 44, gap: 6, pad: 10, label: 64 }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const groupSvg = (g: CoreGroup) => {
  const width = CELL.pad * 2 + CELL.label + g.members.length * (CELL.w + CELL.gap)
  const height = CELL.pad * 2 + CELL.h * 2 + CELL.gap
  const row = (ap: 'dark' | 'light', y: number) => {
    const fg = ap === 'dark' ? '#dceaf7' : '#13233a'
    const cells = g.members.map((m, i) => {
      const x = CELL.pad + CELL.label + i * (CELL.w + CELL.gap)
      return `<rect x="${x}" y="${y + 6}" width="${CELL.w}" height="${CELL.h - 12}" rx="6" fill="${m.color[ap]}"/>`
        + `<text x="${x + CELL.w / 2}" y="${y + CELL.h / 2 + 5}" fill="${ap === 'dark' ? '#000' : '#fff'}" font-size="14" font-weight="700" text-anchor="middle">${esc(m.ja)}</text>`
    }).join('')
    return `<rect x="0" y="${y}" width="${width}" height="${CELL.h}" fill="${SAMPLE_BG[ap]}"/>`
      + `<text x="${CELL.pad}" y="${y + CELL.h / 2 + 4}" fill="${fg}" font-size="12" font-family="monospace">${ap}</text>${cells}`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="sans-serif">
<rect width="${width}" height="${height}" rx="10" fill="${SAMPLE_BG.dark}"/>
${row('dark', CELL.pad)}
${row('light', CELL.pad + CELL.h + CELL.gap)}
</svg>
`
}

const THEME_CHIPS: Role[] = ['accent', 'success', 'danger', 'warning', 'notice']
const THEME_PANEL = { w: 150, h: 76, gap: 8 }

const themesSvg = () => {
  const width = THEMES.length * (THEME_PANEL.w + THEME_PANEL.gap) - THEME_PANEL.gap
  const panels = THEMES.map((t, i) => {
    const d = dictFor(t, null)
    const x = i * (THEME_PANEL.w + THEME_PANEL.gap)
    const chips = THEME_CHIPS.map((r, j) => `<rect x="${x + 10 + j * 26}" y="48" width="20" height="16" rx="4" fill="${d[r]}"/>`).join('')
    return `<rect x="${x}" y="0" width="${THEME_PANEL.w}" height="${THEME_PANEL.h}" rx="8" fill="${d.bg}" stroke="${d.borderStrong}"/>`
      + `<rect x="${x + 6}" y="6" width="${THEME_PANEL.w - 12}" height="34" rx="6" fill="${d.surface}"/>`
      + `<text x="${x + 12}" y="28" fill="${d.text}" font-size="13" font-weight="700">${esc(t.label)}</text>`
      + `<text x="${x + THEME_PANEL.w - 12}" y="28" fill="${d.textMuted}" font-size="11" text-anchor="end">Aa</text>${chips}`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${THEME_PANEL.h}" viewBox="0 0 ${width} ${THEME_PANEL.h}" font-family="sans-serif">${panels}</svg>\n`
}

// README の表に載せる役割 (全 24 役割は colors.json にある)
const TABLE_ROLES: Role[] = ['bg', 'surface', 'text', 'textMuted', 'border', 'accent', 'action', 'success', 'danger', 'warning', 'notice']

const groupSection = (g: CoreGroup) => [
  `### ${g.label} (\`groups/${g.id}.json\`)`,
  '',
  ...(g.note === '' ? [] : [g.note, '']),
  `![${g.label}](docs/swatches/group-${g.id}.svg)`,
  '',
  '| id | 表示 | 由来 | dark | light | 地とのコントラスト (dark / light) |',
  '|---|---|---|---|---|---|',
  ...g.members.map((m) => `| \`${memberSlug(m)}\` | ${m.ja} ${m.label} | ${m.motif} | \`${m.color.dark}\` | \`${m.color.light}\` | ${contrast(m.color.dark, SAMPLE_BG.dark).toFixed(2)} / ${contrast(m.color.light, SAMPLE_BG.light).toFixed(2)} |`),
  '',
]

const themeSection = () => [
  '### テーマ (`src/tokens.ts`)',
  '',
  '![themes](docs/swatches/themes.svg)',
  '',
  `core なしの値。全 24 役割と core ごとの値は \`colors.json\` にある。`,
  '',
  `| 役割 | ${THEMES.map((t) => t.label).join(' | ')} |`,
  `|---|${THEMES.map(() => '---').join('|')}|`,
  ...TABLE_ROLES.map((r) => `| \`${r}\` | ${THEMES.map((t) => `\`${dictFor(t, null)[r]}\``).join(' | ')} |`),
  '',
]

const section = () => [
  BEGIN,
  '## 色の一覧',
  '',
  `生成の既定: 染め具合 ${EXPORT_DEFAULTS.tint * 100}%・衝突の解き方 ${EXPORT_DEFAULTS.strategy}。地とのコントラストは Blueprint / Whiteprint の地 (\`${SAMPLE_BG.dark}\` / \`${SAMPLE_BG.light}\`) に対する比。4.5 未満の色は、生成時に色相を保ったまま明度だけ持ち上げる。`,
  '',
  ...GROUPS.flatMap(groupSection),
  ...themeSection(),
  END,
].join('\n')

const writeReadme = () => {
  const src = readFileSync(README, 'utf8')
  const start = src.indexOf(BEGIN)
  const end = src.indexOf(END)
  if (start === -1 || end === -1) throw new Error(`README.md に ${BEGIN} と ${END} の組がありません`)
  writeFileSync(README, src.slice(0, start) + section() + src.slice(end + END.length))
}

mkdirSync(SWATCH_DIR, { recursive: true })
GROUPS.forEach((g) => writeFileSync(new URL(`group-${g.id}.svg`, SWATCH_DIR), groupSvg(g)))
writeFileSync(new URL('themes.svg', SWATCH_DIR), themesSvg())
writeReadme()
console.log(`wrote README.md (色の一覧) / docs/swatches/ (${GROUPS.length + 1} svg)`)
