// 曜日色を primary (action) に入れたときの、意味色 (success / danger / warning / notice) との衝突の解き方。
// どれも辞書 → 辞書の変換なので、適用先 (変換表) は解き方を知らなくてよい。demo で並べて比べる
import { alpha, contrast, fromOklch, labDistance, parse, toOklch } from './color.ts'
import { type Dictionary, onColorOf } from './dictionary.ts'

export type StrategyId = 'none' | 'rehue-day' | 'shift-semantic' | 'tone-split'
export type Strategy = { id: StrategyId; label: string; note: string; apply: (d: Dictionary) => Dictionary }

const SEMANTICS = ['success', 'danger', 'warning', 'notice'] as const
type Semantic = (typeof SEMANTICS)[number]

// audit.ts の DISTANCE と同じ尺度。0.16 以上で「並べなくても見分けられる」
export const DISTINCT = { clash: 0.1, near: 0.16 }
const BODY_CONTRAST = 4.5
// 色相を回す上限。これ以上回すと「火曜 = 紅」のような曜日の字が崩れる
const MAX_HUE_SHIFT = 60
const MAX_LIGHTNESS_SHIFT = 0.3
const STEP_HUE = 1
const STEP_L = 0.01

export type Nearest = { semantic: Semantic; dist: number }

export const nearestSemantic = (d: Dictionary, color: string): Nearest =>
  SEMANTICS.map((s) => ({ semantic: s, dist: labDistance(color, d[s]) })).reduce((a, b) => (b.dist < a.dist ? b : a))

const alphaOf = (css: string) => parse(css).a

// action を差し替え、文字色も付け直す
const withAction = (d: Dictionary, action: string): Dictionary => ({ ...d, action, onAction: onColorOf(d.bg, d.text, action) })

const contrastOk = (fg: string, bg: string) => contrast(fg, bg) >= BODY_CONTRAST

// その色を地にしたとき、載せる文字が本文基準で読めるか
const isReadable = (d: Dictionary, color: string) => contrastOk(onColorOf(d.bg, d.text, color), color)

// 0, +1, -1, +2, -2 … の順に試す (動かす量を最小にする)
const offsets = (max: number, step: number) =>
  Array.from({ length: Math.floor(max / step) }, (_, i) => (i + 1) * step).flatMap((x) => [x, -x])

const isDistinct = (d: Dictionary, color: string) => nearestSemantic(d, color).dist >= DISTINCT.near

// 1. 曜日色の色相を、意味色から離れるまで少しずつ回す (accent も一緒に動く = 曜日の色そのものを直す)
const rehueDay = (d: Dictionary): Dictionary => {
  if (isDistinct(d, d.action)) return d
  const { l, c, h } = toOklch(d.action)
  const found = offsets(MAX_HUE_SHIFT, STEP_HUE)
    .map((dh) => fromOklch(l, c, h + dh))
    .find((color) => color !== null && isDistinct(d, color) && isReadable(d, color))
  if (found === undefined || found === null) return d
  return { ...withAction(d, found), accent: found, accentSubtle: alpha(found, alphaOf(d.accentSubtle)), onAccent: onColorOf(d.bg, d.text, found) }
}

// 2. 曜日色は動かさず、ぶつかった意味色の色相を逃がす (danger を朱寄り / 桃寄りへ)
const shiftSemantic = (d: Dictionary): Dictionary => {
  const near = nearestSemantic(d, d.action)
  if (near.dist >= DISTINCT.near) return d
  const { l, c, h } = toOklch(d[near.semantic])
  const others = SEMANTICS.filter((s) => s !== near.semantic).map((s) => d[s])
  const found = offsets(MAX_HUE_SHIFT, STEP_HUE)
    .map((dh) => fromOklch(l, c, h + dh))
    .find((color) => color !== null && labDistance(color, d.action) >= DISTINCT.near
      && others.every((o) => labDistance(color, o) >= DISTINCT.near) && contrastOk(color, d.bg))
  if (found === undefined || found === null) return d
  const subtleKey = `${near.semantic}Subtle` as const
  return { ...d, [near.semantic]: found, [subtleKey]: alpha(found, alphaOf(d[subtleKey])) }
}

// 3. 色相は曜日のまま、primary の明度だけをずらして意味色と分ける (accent = 縁取りは元の曜日色)
const toneSplit = (d: Dictionary): Dictionary => {
  if (isDistinct(d, d.action)) return d
  const { l, c, h } = toOklch(d.action)
  const found = offsets(MAX_LIGHTNESS_SHIFT, STEP_L)
    .map((dl) => fromOklch(l + dl, c, h) ?? fromOklch(l + dl, c * 0.8, h))
    .find((color) => color !== null && isDistinct(d, color) && isReadable(d, color))
  if (found === undefined || found === null) return d
  return withAction(d, found)
}

export const STRATEGIES: readonly Strategy[] = [
  { id: 'none', label: 'そのまま', note: 'primary = 曜日色。衝突は放置 (比較の基準)', apply: (d) => d },
  { id: 'rehue-day', label: '曜日色を回す', note: '近い曜日だけ、曜日色の色相を最小限回して意味色から離す。縁取りも一緒に動く', apply: rehueDay },
  { id: 'shift-semantic', label: '意味色を逃がす', note: '曜日色はそのまま、ぶつかった意味色の色相を最小限回す (その曜日だけ)', apply: shiftSemantic },
  { id: 'tone-split', label: '明度で分ける', note: '色相は曜日のまま、primary の明度だけずらす。縁取りは元の曜日色', apply: toneSplit },
]

export const strategyOf = (id: StrategyId): Strategy => {
  const s = STRATEGIES.find((x) => x.id === id)
  if (s === undefined) throw new Error(`strategy ${id} がありません`)
  return s
}
