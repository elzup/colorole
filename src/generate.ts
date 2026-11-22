// core color (曜日色) を主軸に variant 全体を作る。下地・面・線・文字の色相を core に寄せ、
// 明度はテーマの値を保つ (= コントラストの骨格はテーマが決め、色味は core が決める)。
// 意味色は寄せない (一致・失敗・注意・要確認の意味を曜日で変えないため)
import { alpha, fromOklch, parse, toOklch } from './color.ts'
import { type Dictionary, type Role, type Theme, onColorOf, resolveTheme } from './dictionary.ts'
import type { CoreMember } from './groups.ts'
import { type StrategyId, strategyOf } from './strategies.ts'

// 0 = テーマのまま (曜日は accent / primary だけ)、1 = 下地まで core の色相に染める
// 半分〜core の間は見た目の変化が大きいので 0.1 刻みで細かく選べるようにする
export const TINTS = [0, 0.5, 0.6, 0.7, 0.8, 0.9, 1] as const
export type Tint = (typeof TINTS)[number]

const OPAQUE_NEUTRALS: Role[] = ['bg', 'bgSubtle', 'surface', 'surfaceSubtle', 'surfaceRaised', 'text', 'textMuted']
const ALPHA_LINES: Role[] = ['border', 'borderStrong', 'gridLine']
// 染めたときに足す彩度 = core の彩度 × この係数。テーマの下地は彩度 0.03〜0.06 なので、
// core (0.15〜0.2) の 1 割強を足すと「何色の日か」が地で分かり、文字の可読性は落ちない
const CHROMA_GAIN = 0.12
// sRGB に収まらないときに彩度を落とす段。明るい地 (Whiteprint) は彩度の余地が小さく、途中で諦めると
// 元の色相のまま残って別の曜日に見える (火曜の地が黄味になった) ので、最後は彩度 0 まで落として色相だけは揃える
const CHROMA_FALLBACK = [1, 0.8, 0.6, 0.4, 0.2, 0]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// 色相は円なので近い向きに補間する
const lerpHue = (a: number, b: number, t: number) => {
  const diff = ((b - a + 540) % 360) - 180
  return (a + diff * t + 360) % 360
}

const tintColor = (css: string, core: { c: number; h: number }, tint: number) => {
  const { l, c, h } = toOklch(css)
  const a = parse(css).a
  const nextH = lerpHue(h, core.h, tint)
  const nextC = c + core.c * CHROMA_GAIN * tint
  const solid = CHROMA_FALLBACK.map((k) => fromOklch(l, nextC * k, nextH)).find((x) => x !== null)
  if (solid === undefined || solid === null) return css
  return a < 1 ? alpha(solid, a) : solid
}

export const tintNeutrals = (d: Dictionary, coreColor: string, tint: number): Dictionary => {
  if (tint === 0) return d
  const core = toOklch(coreColor)
  const tinted = Object.fromEntries(
    [...OPAQUE_NEUTRALS, ...ALPHA_LINES].map((role) => [role, tintColor(d[role], core, tint)]),
  ) as Partial<Dictionary>
  const next = { ...d, ...tinted }
  // 地が変わったので、地に載せる文字色を付け直す
  return { ...next, onAccent: onColorOf(next.bg, next.text, next.accent), onAction: onColorOf(next.bg, next.text, next.action) }
}

export type VariantSpec = { theme: Theme; core: CoreMember | null; tint: Tint; strategy: StrategyId }

// テーマ (明度の骨格) → core で染める → primary と意味色の衝突を解く
export const generate = ({ theme, core, tint, strategy }: VariantSpec): Dictionary => {
  const base = resolveTheme(theme, core)
  return strategyOf(strategy).apply(tintNeutrals(base, base.accent, tint))
}
