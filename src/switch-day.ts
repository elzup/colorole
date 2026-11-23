// 今日 (または --day) の曜日バリアントに VSCode / Zed のテーマを切り替える。
//   node src/switch-day.ts [--day tue] [--palette blueprint|contrast] [--dry-run]
// settings.json はどちらも JSONC (コメント付き) なので、JSON として読み直さず該当行だけ置換する
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { parseArgs } from 'node:util'
import { type Day, DAYS, PALETTES, appearancesOf } from './tokens.ts'
import { variantName } from './variants.ts'

const VSCODE_SETTINGS = `${homedir()}/Library/Application Support/Code/User/settings.json`
const ZED_SETTINGS = `${homedir()}/.config/zed/settings.json`

type Edit = { file: string; before: string; after: string }

const pickDay = (key: string | undefined): Day => {
  const day = key === undefined ? DAYS[new Date().getDay()] : DAYS.find((d) => d.key === key)
  if (day === undefined) throw new Error(`--day は ${DAYS.map((d) => d.key).join(' / ')} のどれか: ${key}`)
  return day
}

const VSCODE_THEME_RE = /"workbench\.colorTheme"\s*:\s*"[^"]*"/

const editVscode = (src: string, themeName: string) => {
  const line = `"workbench.colorTheme": ${JSON.stringify(themeName)}`
  if (VSCODE_THEME_RE.test(src)) return src.replace(VSCODE_THEME_RE, line)
  return src.replace('{', `{\n  ${line},`)
}

// "icon_theme" / "markdown_preview_theme" には当たらない (直前が " であることを要求)
const ZED_THEME_RE = /"theme"\s*:\s*\{[^{}]*\}/

const editZed = (src: string, dark: string, light: string) => {
  const current = ZED_THEME_RE.exec(src)
  if (current === null) throw new Error(`${ZED_SETTINGS} に "theme": { ... } が見つかりません`)
  // mode (dark / light / system) は利用者の選択なので引き継ぐ
  const mode = /"mode"\s*:\s*"([^"]*)"/.exec(current[0])?.[1] ?? 'system'
  const block = `"theme": {\n    "mode": ${JSON.stringify(mode)},\n    "light": ${JSON.stringify(light)},\n    "dark": ${JSON.stringify(dark)},\n  }`
  return src.replace(ZED_THEME_RE, block)
}

const planEdits = (day: Day, paletteId: string): Edit[] => {
  const palette = PALETTES.find((p) => p.id === paletteId)
  const pairs = PALETTES.filter((p) => appearancesOf(p).length === 2)
  if (palette === undefined || !pairs.includes(palette)) throw new Error(`--palette は ${pairs.map((p) => p.id).join(' / ')} (エディタの dark / light の対になるもの)`)
  const dark = variantName(palette, 'dark', day)
  const light = variantName(palette, 'light', day)
  const read = (f: string) => (existsSync(f) ? readFileSync(f, 'utf8') : null)
  const vs = read(VSCODE_SETTINGS)
  const zed = read(ZED_SETTINGS)
  return [
    ...(vs === null ? [] : [{ file: VSCODE_SETTINGS, before: vs, after: editVscode(vs, dark) }]),
    ...(zed === null ? [] : [{ file: ZED_SETTINGS, before: zed, after: editZed(zed, dark, light) }]),
  ]
}

const main = () => {
  const { values } = parseArgs({
    options: {
      day: { type: 'string' },
      palette: { type: 'string', default: 'blueprint' },
      'dry-run': { type: 'boolean', default: false },
    },
  })
  const day = pickDay(values.day)
  const edits = planEdits(day, values.palette)
  edits.forEach((e) => {
    const changed = e.before !== e.after
    console.log(`${changed ? 'change' : 'same  '} ${e.file} → ${day.ja}曜 (${day.motif})`)
    if (changed && !values['dry-run']) writeFileSync(e.file, e.after)
  })
}

main()
