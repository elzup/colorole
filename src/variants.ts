// パレット × 明暗 × 曜日 × 方式 を 1 つの「バリアント」に解決する。生成器とプレビューはこれだけを見る
import { type Appearance, type BaseColors, type Day, type Palette, PALETTES, appearancesOf, colorsOf } from './tokens.ts'
import { ALL_MEMBERS, memberSlug } from './groups.ts'
import { alpha, contrast, fromOklch, hex, mix, toOklch } from './color.ts'
import { type Proposal, proposeKeyword } from './propose.ts'

// current: keyword に曜日色を入れる (最初の実装)
// a:       曜日色は UI の縁取りだけ。keyword は曜日に依らない固定色 (propose.ts で選ぶ)
export type Scheme = 'current' | 'a'
export const SCHEMES: readonly Scheme[] = ['current', 'a']

export type Syntax = {
  comment: string
  keyword: string
  string: string
  number: string
  type: string
  fn: string
  variable: string
  property: string
  operator: string
  punctuation: string
  tag: string
  attribute: string
  invalid: string
}

export type Variant = {
  name: string
  slug: string
  scheme: Scheme
  palette: Palette
  appearance: Appearance
  day: Day | null
  // base.accent は曜日色 (曜日なしなら元の accent)
  base: BaseColors
  // 曜日で回さない元の accent。関数名・リンク・info に使う
  fixedAccent: string
  // ボタン・バッジの地。案 a では曜日色にしない (火曜の紅いバッジがエラー件数に見えるため)
  button: string
  syntax: Syntax
  keywordProposal: Proposal | null
}

// 曜日色は keyword (本文の文字) にも使うので、地に対して本文基準を満たすまで明度だけ地から遠ざける。
// 曜日色は明暗ごとに 1 色しか持たないので、灰の地 (dim) では暗い/明るい地向けの色がそのままだと読めない
const DAY_MIN_CONTRAST = 4.5
const LIFT_STEP = 0.01
const LIFT_MAX = 0.4

const CHROMA_STEP = 0.002
const fitChroma = (l: number, c: number, h: number) =>
  Array.from({ length: Math.ceil(c / CHROMA_STEP) + 1 }, (_, i) => Math.max(0, c - i * CHROMA_STEP))
    .map((k) => fromOklch(l, k, h)).find((x) => x !== null) ?? null

const readableDay = (color: string, bg: string, appearance: Appearance) => {
  if (contrast(color, bg) >= DAY_MIN_CONTRAST) return color
  const { l, c, h } = toOklch(color)
  const sign = appearance === 'dark' ? 1 : -1
  const steps = Array.from({ length: Math.round(LIFT_MAX / LIFT_STEP) }, (_, i) => l + sign * (i + 1) * LIFT_STEP)
  // 明度を動かすと sRGB の彩度の余地が変わるので、その明度で収まる一番高い彩度を使う (くすませすぎない)
  const found = steps.map((nl) => fitChroma(nl, c, h))
    .find((x) => x !== null && contrast(x, bg) >= DAY_MIN_CONTRAST)
  if (found === undefined || found === null) throw new Error(`曜日色 ${color} を地 ${bg} で読める明度にできません`)
  return found
}

const applyDay = (base: BaseColors, day: Day | null, appearance: Appearance): BaseColors => {
  if (day === null) return base
  const accent = readableDay(day.color[appearance], hex(base.bg), appearance)
  return { ...base, accent, accentDim: alpha(accent, 0.14), gridLine: alpha(accent, 0.09) }
}

const toHexColors = (c: BaseColors): BaseColors =>
  Object.fromEntries(Object.entries(c).map(([k, v]) => [k, hex(v)])) as BaseColors

// string = green / number = orange / type = violet は semantic 色の流用。
// 「レポートとエディタで同じ色が同じ種類を指す」ことを優先した
const buildSyntax = (base: BaseColors, fixedAccent: string, keyword: string): Syntax => ({
  comment: base.textDim,
  keyword,
  string: base.green,
  number: base.orange,
  type: base.violet,
  fn: fixedAccent,
  variable: base.text,
  property: mix(base.text, fixedAccent, 0.35),
  operator: base.textDim,
  punctuation: base.textDim,
  tag: keyword,
  attribute: base.orange,
  invalid: base.red,
})

// 案 a の keyword は曜日に依らないので、パレット × 明暗ごとに 1 回だけ選ぶ
const keywordCache = new Map<string, Proposal>()

const fixedKeyword = (palette: Palette, appearance: Appearance, base: BaseColors, fixedAccent: string) => {
  const key = `${palette.id}-${appearance}`
  const cached = keywordCache.get(key)
  if (cached !== undefined) return cached
  const proposal = proposeKeyword({
    avoid: { string: base.green, number: base.orange, type: base.violet, function: fixedAccent, error: base.red, variable: base.text },
    backgrounds: [base.bg, base.surface],
    contrast,
  })
  keywordCache.set(key, proposal)
  return proposal
}

export const variantName = (palette: Palette, appearance: Appearance, day: Day | null) => {
  // 明暗の片方しか無いパレット (Mid) は Dark / Light を付けない
  const mode = appearancesOf(palette).length === 1 ? '' : appearance === 'dark' ? ' Dark' : ' Light'
  return `${palette.label}${mode}${day === null ? '' : ` · ${day.label}`}`
}

const slugOf = (palette: Palette, appearance: Appearance, day: Day | null) =>
  [palette.id, appearance, day === null ? undefined : memberSlug(day)].filter(Boolean).join('-')

export const buildVariant = (palette: Palette, appearance: Appearance, day: Day | null, scheme: Scheme = 'current'): Variant => {
  const raw = toHexColors(colorsOf(palette, appearance))
  const base = toHexColors(applyDay(colorsOf(palette, appearance), day, appearance))
  const fixedAccent = raw.accent
  const proposal = scheme === 'a' ? fixedKeyword(palette, appearance, raw, fixedAccent) : null
  const keyword = proposal === null ? base.accent : proposal.color
  return {
    name: variantName(palette, appearance, day),
    slug: slugOf(palette, appearance, day),
    scheme,
    palette,
    appearance,
    day,
    base,
    fixedAccent,
    button: scheme === 'a' ? fixedAccent : base.accent,
    syntax: buildSyntax(base, fixedAccent, keyword),
    keywordProposal: proposal,
  }
}

export const allVariants = (scheme: Scheme = 'current'): Variant[] =>
  PALETTES.flatMap((palette) =>
    appearancesOf(palette).flatMap((appearance) =>
      [null, ...ALL_MEMBERS].map((day) => buildVariant(palette, appearance, day, scheme)),
    ),
  )
