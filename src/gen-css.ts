// 辞書 → report-doc の変換表 → CSS 変数ブロック。色だけを出す (フォント・レイアウトは report-theme.css 側の持ち物)
//   node src/gen-css.ts                 → dist/tokens.css
//   node src/gen-css.ts --into <file>   → <file> の BEGIN/END マーカー間を置き換える (report-theme.css 用)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { type Appearance, type Palette, DAYS, DAY_MIX, PALETTES, appearancesOf } from './tokens.ts'
import { THEMES, resolveTheme } from './dictionary.ts'
import { TARGETS, applyTarget } from './targets.ts'

export const BEGIN = '/* @@BLUEPRINT-TOKENS:BEGIN — 生成物。編集は elzup/colorole の src/tokens.ts で行い gen-css で再生成 */'
export const END = '/* @@BLUEPRINT-TOKENS:END */'

const REPORT = TARGETS.find((t) => t.id === 'report')

const varLines = (family: string, appearance: Appearance, indent: string) => {
  const theme = THEMES.find((t) => t.family === family && t.appearance === appearance)
  if (theme === undefined || REPORT === undefined) throw new Error(`${family} ${appearance} のテーマか report の変換表がありません`)
  return Object.entries(applyTarget(REPORT, resolveTheme(theme, null))).map(([k, v]) => `${indent}--${k}: ${v};`)
}

const dayLines = (appearance: Appearance, indent: string) =>
  DAYS.map((d) => `${indent}--day-${d.key}: ${d.color[appearance]};`)

const block = (selector: string, lines: string[], indent: string) =>
  [`${indent}${selector} {`, ...lines, `${indent}}`].join('\n')

const comment = (text: string, indent: string) => `${indent}/* ${text} */`

// guard: 閲覧側が <html data-theme="dark|light"> で明暗を強制できる形にする (Artifact 公開用)。
// 既定の report-theme.css は OS 設定だけで切り替える
const lightBlocks = (selector: string, lines: string[], guard: boolean) => {
  if (!guard) return [`@media (prefers-color-scheme: light) {\n${block(selector, lines, "  ")}\n}`]
  const withScheme = [...lines, "    color-scheme: light;"]
  return [
    `@media (prefers-color-scheme: light) {\n${block(`${selector}:not([data-theme="dark"])`, withScheme, "  ")}\n}`,
    block(`${selector}[data-theme="light"]`, withScheme.map((l) => l.slice(2)), ""),
  ]
}

// 明暗の片方しか無いパレット (mid) は OS の明暗設定に関係なくその地にする
const singleCss = (p: Palette, appearance: Appearance) =>
  [block(p.selector, [comment(p.comment[appearance] ?? p.label, '  '), ...varLines(p.id, appearance, '  '), `  color-scheme: ${appearance};`], '')]

const paletteCss = (guard: boolean) =>
  PALETTES.flatMap((p) => {
    const sides = appearancesOf(p)
    if (sides.length === 1) return singleCss(p, sides[0])
    const isRoot = p.selector === ':root'
    const darkLines = [
      comment(p.comment.dark ?? '', '  '),
      ...varLines(p.id, 'dark', '  '),
      ...(isRoot ? ['', comment('曜日 accent の色見本 (data-day で accent に流す)', '  '), ...dayLines('dark', '  ')] : []),
    ]
    const lightLines = [
      comment(p.comment.light ?? '', '    '),
      ...varLines(p.id, 'light', '    '),
      ...(isRoot ? ['', ...dayLines('light', '    ')] : []),
    ]
    return [
      block(p.selector, guard && isRoot ? [...darkLines, '  color-scheme: dark;'] : darkLines, ''),
      ...lightBlocks(p.selector, lightLines, guard),
    ]
  })

// data-day はパレットより後に置く。:root[data-palette] と :root[data-day] は詳細度が同じなので、後勝ちで曜日 accent を効かせる
const dayCss = () => [
  [
    comment('曜日テーマ: <html data-day="sun..sat">。変えるのは accent (と accent-dim / 方眼) だけ。状態色は固定', ''),
    ...DAYS.map((d) => `:root[data-day="${d.key}"] { --accent: var(--day-${d.key}); }`),
  ].join('\n'),
  block(
    ':root[data-day]',
    [
      `  --accent-dim: color-mix(in srgb, var(--accent) ${DAY_MIX.accentDim}%, transparent);`,
      `  --grid-line: color-mix(in srgb, var(--accent) ${DAY_MIX.gridLine}%, transparent);`,
    ],
    '',
  ),
]

export const renderCss = (guard = false) => [BEGIN, ...paletteCss(guard), ...dayCss(), END].join('\n\n') + '\n'

const replaceBetweenMarkers = (file: string, css: string) => {
  const src = readFileSync(file, 'utf8')
  const start = src.indexOf('/* @@BLUEPRINT-TOKENS:BEGIN')
  const endAt = src.indexOf(END)
  if (start < 0 || endAt < 0) {
    throw new Error(`${file} に BEGIN/END マーカーがありません。トークン部分を一度マーカーで囲んでください`)
  }
  const next = src.slice(0, start) + css.trimEnd() + src.slice(endAt + END.length)
  writeFileSync(file, next)
}

const main = () => {
  const { values } = parseArgs({ options: { into: { type: 'string' } } })
  const css = renderCss()
  if (values.into !== undefined) {
    replaceBetweenMarkers(values.into, css)
    console.log(`updated ${values.into}`)
    return
  }
  mkdirSync('dist', { recursive: true })
  writeFileSync('dist/tokens.css', css)
  console.log('wrote dist/tokens.css')
}

if (import.meta.url === `file://${process.argv[1]}`) main()
