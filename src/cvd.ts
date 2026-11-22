// 色覚の多様性のシミュレーション。Machado, Oliveira & Fernandes (2009) の severity 1.0 の行列を線形 RGB に掛ける。
// 1 型 (P) / 2 型 (D) / 3 型 (T) で「区別できるか」を測るために使う (色だけに頼らない設計の確認用)
import { parse } from './color.ts'

export type Vision = 'normal' | 'protan' | 'deutan' | 'tritan'
export const VISIONS: readonly Vision[] = ['normal', 'protan', 'deutan', 'tritan']
export const VISION_LABEL: Record<Vision, string> = { normal: '一般', protan: 'P 型', deutan: 'D 型', tritan: 'T 型' }

type Matrix = readonly [readonly number[], readonly number[], readonly number[]]
const MATRIX: Record<Exclude<Vision, 'normal'>, Matrix> = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
}

// sRGB の伝達関数 (IEC 61966-2-1)
const toLinear = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const toByte = (v: number) => {
  const c = Math.min(1, Math.max(0, v))
  return Math.round((c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255)
}

export const simulate = (css: string, vision: Vision): string => {
  if (vision === 'normal') return css
  const { r, g, b } = parse(css)
  const x = [toLinear(r), toLinear(g), toLinear(b)]
  return `#${MATRIX[vision].map((row) => toByte(row[0] * x[0] + row[1] * x[1] + row[2] * x[2]).toString(16).padStart(2, '0')).join('')}`
}
