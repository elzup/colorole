// テーマ (パレット) の正本。core 色のグループは groups/*.json。CSS / VSCode / Zed はすべてこの 2 つから生成する。
// 値は CSS にそのまま書ける形 (#hex / rgba()) で持つ。エディタ用の hex 変換は color.ts が行う。
import { LEGACY_GROUP, groupOf } from './groups.ts'

export type Appearance = 'dark' | 'light'
export const APPEARANCES: readonly Appearance[] = ['dark', 'light']

export type BaseColors = {
  bg: string
  bg2: string
  surface: string
  surface2: string
  surfaceElevated: string
  gridLine: string
  border: string
  borderBright: string
  text: string
  textDim: string
  accent: string
  accentDim: string
  green: string
  greenDim: string
  red: string
  redDim: string
  orange: string
  orangeDim: string
  violet: string
  violetDim: string
}

// 中灰 (mid) のように明暗の片方しか無いパレットがあるので、dark / light はどちらか一方でもよい
export type Palette = {
  id: string
  label: string
  selector: string
  comment: Partial<Record<Appearance, string>>
  colors: Partial<Record<Appearance, BaseColors>>
}

export const appearancesOf = (p: Palette): Appearance[] => APPEARANCES.filter((ap) => p.colors[ap] !== undefined)

export const colorsOf = (p: Palette, ap: Appearance): BaseColors => {
  const colors = p.colors[ap]
  if (colors === undefined) throw new Error(`パレット ${p.id} に ${ap} がありません`)
  return colors
}

const blueprint: Palette = {
  id: 'blueprint',
  label: 'Blueprint',
  selector: ':root',
  comment: {
    dark: '青図 (blueprint): 濃紺 × シアン',
    light: '白図 (whiteprint): クリーム紙 × 藍インク',
  },
  colors: {
    dark: {
      bg: '#0a1626',
      bg2: '#071120',
      surface: '#0f2036',
      surface2: '#142942',
      surfaceElevated: '#16304d',
      gridLine: 'rgba(120, 200, 255, 0.055)',
      border: 'rgba(150, 210, 255, 0.13)',
      borderBright: 'rgba(150, 210, 255, 0.3)',
      text: '#dceaf7',
      textDim: '#7b98b5',
      accent: '#4dc4f5',
      accentDim: 'rgba(77, 196, 245, 0.09)',
      green: '#4ade80',
      greenDim: 'rgba(74, 222, 128, 0.11)',
      red: '#ff7a7a',
      redDim: 'rgba(255, 122, 122, 0.11)',
      orange: '#ffb84d',
      orangeDim: 'rgba(255, 184, 77, 0.11)',
      violet: '#b79cff',
      violetDim: 'rgba(183, 156, 255, 0.11)',
    },
    light: {
      bg: '#f4f1e8',
      bg2: '#efeadd',
      surface: '#fbf9f3',
      surface2: '#f0ece0',
      surfaceElevated: '#ffffff',
      gridLine: 'rgba(20, 70, 120, 0.06)',
      border: 'rgba(20, 60, 100, 0.16)',
      borderBright: 'rgba(20, 60, 100, 0.32)',
      text: '#16304d',
      textDim: '#5b7690',
      accent: '#0b6f9e',
      accentDim: 'rgba(11, 111, 158, 0.08)',
      green: '#12784a',
      greenDim: 'rgba(18, 120, 74, 0.1)',
      red: '#b3261e',
      redDim: 'rgba(179, 38, 30, 0.09)',
      orange: '#9a5c00',
      orangeDim: 'rgba(154, 92, 0, 0.1)',
      violet: '#5b3fb8',
      violetDim: 'rgba(91, 63, 184, 0.09)',
    },
  },
}

const contrast: Palette = {
  id: 'contrast',
  label: 'Blueprint Contrast',
  selector: ':root[data-palette="contrast"]',
  comment: {
    dark:
      'High Contrast パレット: <html data-palette="contrast"> で有効 (pdash D-0031)。\n' +
      '   Blueprint の細い mono 小文字は暗い地で滲んで読めないため、純黒 / 純白に寄せる',
    light: 'High Contrast (light)',
  },
  colors: {
    dark: {
      bg: '#000000',
      bg2: '#000000',
      surface: '#0d0d0d',
      surface2: '#161616',
      surfaceElevated: '#1a1a1a',
      gridLine: 'rgba(255, 255, 255, 0.035)',
      border: 'rgba(255, 255, 255, 0.3)',
      borderBright: 'rgba(255, 255, 255, 0.55)',
      text: '#ffffff',
      textDim: '#c4c4c4',
      accent: '#5cc8ff',
      accentDim: 'rgba(92, 200, 255, 0.14)',
      green: '#3dff8f',
      greenDim: 'rgba(61, 255, 143, 0.14)',
      red: '#ff5050',
      redDim: 'rgba(255, 80, 80, 0.14)',
      orange: '#ffc400',
      orangeDim: 'rgba(255, 196, 0, 0.14)',
      violet: '#c99bff',
      violetDim: 'rgba(201, 155, 255, 0.14)',
    },
    light: {
      bg: '#ffffff',
      bg2: '#f4f4f4',
      surface: '#ffffff',
      surface2: '#f0f0f0',
      surfaceElevated: '#ffffff',
      gridLine: 'rgba(0, 0, 0, 0.04)',
      border: 'rgba(0, 0, 0, 0.45)',
      borderBright: 'rgba(0, 0, 0, 0.75)',
      text: '#000000',
      textDim: '#333333',
      accent: '#0050b3',
      accentDim: 'rgba(0, 80, 179, 0.1)',
      green: '#006b2e',
      greenDim: 'rgba(0, 107, 46, 0.1)',
      red: '#b00000',
      redDim: 'rgba(176, 0, 0, 0.1)',
      orange: '#8a4b00',
      orangeDim: 'rgba(138, 75, 0, 0.1)',
      violet: '#5a1fb0',
      violetDim: 'rgba(90, 31, 176, 0.1)',
    },
  },
}

// 白黒の間の灰。真ん中 (L 0.5 前後) は白文字・黒文字とも約 4.6:1 で頭打ちになり、補足文や意味色の入る余地が無い。
// なので「暗い灰に白文字」(L 0.34) と「明るい灰に黒文字」(L 0.88) の 2 つに分ける (D-0010)。
// 間の中灰は mid パレット (黒 / 濃灰 / 中灰 / 淡灰 / 白 の 5 段は Theme.step で並べる、D-0014)
const dim: Palette = {
  id: 'dim',
  label: 'Blueprint Dim',
  selector: ':root[data-palette="dim"]',
  comment: {
    dark: 'Dim パレット (dark): 中灰の地に白文字。純黒より眩しさが少ない',
    light: 'Dim パレット (light): 明るい灰の地に黒文字。純白より眩しさが少ない',
  },
  colors: {
    dark: {
      bg: '#35383c',
      bg2: '#2d3134',
      surface: '#3f4347',
      surface2: '#4a4d51',
      surfaceElevated: '#52565a',
      gridLine: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.16)',
      borderBright: 'rgba(255, 255, 255, 0.45)',
      text: '#eff2f5',
      textDim: '#c4cbd2',
      accent: '#73d3f7',
      accentDim: 'rgba(115, 211, 247, 0.14)',
      green: '#7fe998',
      greenDim: 'rgba(127, 233, 152, 0.14)',
      red: '#f3a6a5',
      redDim: 'rgba(243, 166, 165, 0.14)',
      orange: '#f4c98d',
      orangeDim: 'rgba(244, 201, 141, 0.14)',
      violet: '#c9a3f5',
      violetDim: 'rgba(201, 163, 245, 0.14)',
    },
    light: {
      bg: '#d5d8db',
      bg2: '#cbced2',
      surface: '#e2e5e8',
      surface2: '#ced1d5',
      surfaceElevated: '#e9ebee',
      gridLine: 'rgba(0, 0, 0, 0.05)',
      border: 'rgba(0, 0, 0, 0.18)',
      borderBright: 'rgba(0, 0, 0, 0.5)',
      text: '#171b1f',
      textDim: '#43484e',
      accent: '#0b4c92',
      accentDim: 'rgba(11, 76, 146, 0.1)',
      green: '#0b5d2a',
      greenDim: 'rgba(11, 93, 42, 0.1)',
      red: '#9b1e22',
      redDim: 'rgba(155, 30, 34, 0.1)',
      orange: '#7d460b',
      orangeDim: 'rgba(125, 70, 11, 0.1)',
      violet: '#5a358c',
      violetDim: 'rgba(90, 53, 140, 0.1)',
    },
  },
}

// 中灰 (L 0.68)。濃灰 (0.34) と淡灰 (0.88) の間を等分に近く埋める。L 0.5 前後は白文字・黒文字とも 4.6:1 で頭打ちなので
// 明るい側に寄せて黒文字を載せる (本文 6.7:1)。暗い側 (L 0.44・白文字) より段の間隔が揃い、本文の余裕も同程度。
// 補足文・意味色はすべて 4.5:1 ちょうどまで暗くするしかなく、意味色どうしの距離は
// 他のテーマより近い (最小 0.091、緑-橙)。色だけで区別させず文字・形と併用する前提 (AQ-0005)
const mid: Palette = {
  id: 'mid',
  label: 'Blueprint Mid',
  selector: ':root[data-palette="mid"]',
  comment: { light: 'Mid パレット: 中灰の地に黒文字。白にも黒にも寄らない地' },
  colors: {
    light: {
      bg: '#96989b',
      bg2: '#8d8f92',
      surface: '#a2a5a8',
      surface2: '#9c9fa1',
      surfaceElevated: '#a8abae',
      gridLine: 'rgba(0, 0, 0, 0.06)',
      border: 'rgba(0, 0, 0, 0.2)',
      borderBright: 'rgba(0, 0, 0, 0.6)',
      text: '#0c0d0f',
      textDim: '#2e3133',
      accent: '#002655',
      accentDim: 'rgba(0, 38, 85, 0.1)',
      green: '#002c02',
      greenDim: 'rgba(0, 44, 2, 0.1)',
      red: '#500020',
      redDim: 'rgba(80, 0, 32, 0.1)',
      orange: '#381f00',
      orangeDim: 'rgba(56, 31, 0, 0.1)',
      violet: '#370067',
      violetDim: 'rgba(55, 0, 103, 0.1)',
    },
  },
}

export const PALETTES: readonly Palette[] = [blueprint, contrast, dim, mid]

// core 色 (曜日など) の正本は groups/*.json (src/groups.ts で読む)。core は accent / primary だけを回す。
// green / red / orange / violet は一致・失敗・注意・要確認の意味を持つので core で入れ替えない (pdash で決めた規約)。
// Day / DAYS は曜日グループを指す互換の名前 (switch-day などは曜日を前提にしている)
export type { CoreMember as Day } from './groups.ts'
export const DAYS = groupOf(LEGACY_GROUP).members

// 曜日 accent から作る淡色の濃さ (pdash の値)。accent-dim が背景、grid-line が方眼
export const DAY_MIX = { accentDim: 14, gridLine: 9 }
