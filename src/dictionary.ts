// 配色辞書: 役割名 → 色。パレット (Blueprint / Contrast) × 明暗 × 曜日 のどれでもキーは同じ。
// 適用先 (CSS / エディタ / UI framework) はバリアントの内部構造ではなくこの辞書だけを読む。
// 色名 (green / red) でなく役割名 (success / danger) にするのは、適用先の枠が役割で切られているため
import { contrast, flatten } from './color.ts'
import { type Appearance, type DayKey, DAYS, PALETTES } from './tokens.ts'
import { type Variant, buildVariant } from './variants.ts'

export type RoleGroup = 'surface' | 'line' | 'text' | 'accent' | 'semantic'

export type RoleSpec = {
  group: RoleGroup
  note: string
  // 曜日で値が変わるか (適用先の枠を曜日色にするかの判断材料)
  isDaily: boolean
}

const spec = (group: RoleGroup, note: string, isDaily = false): RoleSpec => ({ group, note, isDaily })

export const ROLE_SPECS = {
  bg: spec('surface', 'ページの地'),
  bgSubtle: spec('surface', 'サイドバー・下段の地'),
  surface: spec('surface', 'カード・パネル'),
  surfaceSubtle: spec('surface', 'muted な面・入力欄'),
  surfaceRaised: spec('surface', 'popover・ダイアログ'),
  border: spec('line', '区切り線'),
  borderStrong: spec('line', '入力欄の枠・強い区切り'),
  gridLine: spec('line', '方眼', true),
  text: spec('text', '本文'),
  textMuted: spec('text', '補足・行番号'),
  accent: spec('accent', '縁取り: focus ring・選択・タブの縁・カーソル', true),
  accentSubtle: spec('accent', 'accent の薄い地 (選択行・hover)', true),
  onAccent: spec('accent', 'accent の地に載せる文字', true),
  brand: spec('accent', '曜日で変えない元の accent: リンク・関数名・info'),
  action: spec('accent', 'primary: ボタン・バッジの地 (曜日色)', true),
  onAction: spec('accent', 'action の地に載せる文字', true),
  success: spec('semantic', '一致・正常'),
  danger: spec('semantic', '欠落・失敗'),
  warning: spec('semantic', '部分的・注意'),
  notice: spec('semantic', '要確認'),
  successSubtle: spec('semantic', 'success の薄い地'),
  dangerSubtle: spec('semantic', 'danger の薄い地'),
  warningSubtle: spec('semantic', 'warning の薄い地'),
  noticeSubtle: spec('semantic', 'notice の薄い地'),
} as const satisfies Record<string, RoleSpec>

export type Role = keyof typeof ROLE_SPECS
export type Dictionary = Record<Role, string>
export const ROLES = Object.keys(ROLE_SPECS) as Role[]

// 色付きの地に載せる文字色。bg と text のうちコントラストの高い方
export const onColorOf = (bg: string, text: string, color: string) =>
  contrast(bg, color) >= contrast(text, color) ? bg : text

const onColor = (v: Variant, color: string) => onColorOf(v.base.bg, v.base.text, color)

// 値は CSS にそのまま書ける形 (#hex / rgba()) のまま返す。不透明な hex が要る適用先は solidify を通す
export const resolve = (v: Variant): Dictionary => {
  const b = v.base
  return {
    bg: b.bg,
    bgSubtle: b.bg2,
    surface: b.surface,
    surfaceSubtle: b.surface2,
    surfaceRaised: b.surfaceElevated,
    border: b.border,
    borderStrong: b.borderBright,
    gridLine: b.gridLine,
    text: b.text,
    textMuted: b.textDim,
    accent: b.accent,
    accentSubtle: b.accentDim,
    onAccent: onColor(v, b.accent),
    brand: v.fixedAccent,
    action: v.button,
    onAction: onColor(v, v.button),
    success: b.green,
    danger: b.red,
    warning: b.orange,
    notice: b.violet,
    successSubtle: b.greenDim,
    dangerSubtle: b.redDim,
    warningSubtle: b.orangeDim,
    noticeSubtle: b.violetDim,
  }
}

// alpha 付きの色を bg に重ねて不透明な hex にする (rgba を受けない framework / エディタ向け)
export const solidify = (dict: Dictionary): Dictionary =>
  Object.fromEntries(
    Object.entries(dict).map(([role, color]) => [role, flatten(color, dict.bg)]),
  ) as Dictionary

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

// { '--bg': '#0a1626', '--bg-subtle': ... }。style 属性や :root にそのまま入れられる
export const toCssVars = (dict: Dictionary, prefix = ''): Record<string, string> =>
  Object.fromEntries(Object.entries(dict).map(([role, color]) => [`--${prefix}${kebab(role)}`, color]))

// ---- テーマ: 明暗は選択軸ではなくテーマの属性 (D-0003)。dark / light の対は family で引く
export type Theme = { id: string; label: string; family: string; appearance: Appearance; paletteId: string }

export const THEMES: readonly Theme[] = [
  { id: 'blueprint', label: 'Blueprint', family: 'blueprint', appearance: 'dark', paletteId: 'blueprint' },
  { id: 'whiteprint', label: 'Whiteprint', family: 'blueprint', appearance: 'light', paletteId: 'blueprint' },
  { id: 'contrast-dark', label: 'Contrast Dark', family: 'contrast', appearance: 'dark', paletteId: 'contrast' },
  { id: 'contrast-light', label: 'Contrast Light', family: 'contrast', appearance: 'light', paletteId: 'contrast' },
]

// 曜日色は primary (action) から変える (D-0004)。意味色との衝突は strategies.ts の解き方で処理する
export const resolveTheme = (theme: Theme, dayKey: DayKey | null): Dictionary => {
  const palette = PALETTES.find((p) => p.id === theme.paletteId)
  if (palette === undefined) throw new Error(`palette ${theme.paletteId} がありません`)
  const day = dayKey === null ? null : (DAYS.find((d) => d.key === dayKey) ?? null)
  return resolve(buildVariant(palette, theme.appearance, day, 'current'))
}

// ---- 背景 × 文字 のペア。WCAG 2.x: body = 1.4.3 本文 4.5:1、ui = 1.4.11 非テキスト 3:1
export type PairUse = 'body' | 'ui'
export type RolePair = { fg: Role; bg: Role; use: PairUse; note: string }
export const PAIR_MIN: Record<PairUse, number> = { body: 4.5, ui: 3.0 }
// 1.4.6 (AAA) の本文基準。判定には使わず表示だけ
export const AAA_BODY = 7.0

const pair = (fg: Role, bg: Role, use: PairUse, note: string): RolePair => ({ fg, bg, use, note })

export const ROLE_PAIRS: readonly RolePair[] = [
  ...(['bg', 'bgSubtle', 'surface', 'surfaceSubtle', 'surfaceRaised'] as const).map((bg) => pair('text', bg, 'body', '本文')),
  ...(['bg', 'surface', 'surfaceSubtle'] as const).map((bg) => pair('textMuted', bg, 'body', '補足文')),
  pair('onAccent', 'accent', 'body', 'accent の地の文字'),
  pair('onAction', 'action', 'body', 'ボタンの文字'),
  pair('brand', 'bg', 'body', 'リンク'),
  ...(['success', 'danger', 'warning', 'notice'] as const).flatMap((c) => [
    pair(c, 'bg', 'body', '状態色の文字'),
    pair(c, `${c}Subtle`, 'body', '通知帯の文字'),
  ]),
  pair('accent', 'bg', 'ui', 'focus ring・カーソル'),
  pair('borderStrong', 'bg', 'ui', '入力欄の枠'),
]

export type PairCheck = RolePair & { ratio: number; min: number; isPass: boolean }

// 半透明の地は bg に重ねてから測る (実際に見える色で判定する)
export const checkPairs = (dict: Dictionary): PairCheck[] => {
  const solid = solidify(dict)
  return ROLE_PAIRS.map((p) => {
    const ratio = contrast(solid[p.fg], solid[p.bg])
    const min = PAIR_MIN[p.use]
    return { ...p, ratio, min, isPass: ratio >= min }
  })
}
