// core 色の候補を測る (手で選ぶとき・agent が選ぶとき共通)。基準を満たさなければ終了コード 1。
//   node src/pick.ts --group week --key sat --dark '#ee95d1' --light '#7f366a'    候補を測るだけ
//   node src/pick.ts --group week --key sat --dark ... --light ... --write        groups/week.json に書く
//   node src/pick.ts --group season --key spring --label Spring --ja 春 --dark ... --light ... --write   新しいメンバー / グループ
// 測るもの: 地との本文コントラスト (全テーマ)、同じグループの他メンバー・意味色との OKLab 距離 (一般 + 色覚シミュレーション 3 型)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { contrast, labDistance } from './color.ts'
import { type Appearance, APPEARANCES } from './tokens.ts'
import { GROUPS } from './groups.ts'
import { THEMES, resolveTheme } from './dictionary.ts'
import { DISTINCT } from './strategies.ts'
import { type Vision, VISIONS, VISION_LABEL, simulate } from './cvd.ts'

const BODY_CONTRAST = 4.5
const HEX = /^#[0-9a-fA-F]{6}$/
const SEMANTICS = ['success', 'danger', 'warning', 'notice'] as const

const { values } = parseArgs({
  options: {
    group: { type: 'string' }, key: { type: 'string' }, dark: { type: 'string' }, light: { type: 'string' },
    label: { type: 'string' }, ja: { type: 'string' }, motif: { type: 'string' }, write: { type: 'boolean', default: false },
  },
})

const need = (name: string, v: string | undefined) => {
  if (v === undefined || v === '') throw new Error(`--${name} が必要です`)
  return v
}
const groupId = need('group', values.group)
const key = need('key', values.key)
const candidate: Record<Appearance, string> = { dark: need('dark', values.dark).toLowerCase(), light: need('light', values.light).toLowerCase() }
APPEARANCES.forEach((ap) => { if (!HEX.test(candidate[ap])) throw new Error(`--${ap} は #rrggbb: ${candidate[ap]}`) })

const group = GROUPS.find((g) => g.id === groupId)
const others = (group?.members ?? []).filter((m) => m.key !== key)

// kind: contrast = 地との本文コントラスト / member = 同じグループの他の色 / semantic = 意味色
type Kind = 'contrast' | 'member' | 'semantic'
type Check = { kind: Kind; vision: Vision; label: string; value: number; min: number }

// 不合格にするのは「本文コントラスト不足」と「一般色覚で他メンバーと衝突」だけ。
// 意味色との近さは衝突の解き方 (明度で分ける) が primary 側で解消し、色覚シミュレーションの近さは
// 色相だけで分けきれない以上 文字・位置を併用する前提で警告に留める (AQ-0005)
// choice のグループ (好みで選ぶ候補の集まり) は 1 つ選んで使うので、メンバー同士の近さは不合格にしない
const isRotation = (group?.kind ?? 'rotation') === 'rotation'
const isBlocking = (c: Check) =>
  (c.kind === 'contrast' && c.value < c.min) || (isRotation && c.kind === 'member' && c.vision === 'normal' && c.value < DISTINCT.clash)
const mark = (c: Check) => (c.value >= c.min ? 'ok  ' : isBlocking(c) ? 'FAIL' : 'warn')

const nearestOf = (ap: Appearance, vision: Vision, pool: { name: string; color: string }[]) => {
  const sim = simulate(candidate[ap], vision)
  return pool.map((x) => ({ ...x, dist: labDistance(sim, simulate(x.color, vision)) })).sort((a, b) => a.dist - b.dist)[0]
}

const checksFor = (ap: Appearance): Check[] => {
  const themes = THEMES.filter((t) => t.appearance === ap)
  const contrasts: Check[] = themes.map((t) => ({ kind: 'contrast', vision: 'normal', label: `地 ${t.label} とのコントラスト`, value: contrast(candidate[ap], resolveTheme(t, null).bg), min: BODY_CONTRAST }))
  const pools: [Kind, { name: string; color: string }[]][] = [
    ['member', others.map((m) => ({ name: `${m.ja} (${m.key})`, color: m.color[ap] }))],
    ['semantic', SEMANTICS.flatMap((s) => themes.map((t) => ({ name: `${s} @${t.label}`, color: resolveTheme(t, null)[s] })))],
  ]
  const distances = pools.flatMap(([kind, pool]) => VISIONS.flatMap((vision): Check[] => {
    const near = nearestOf(ap, vision, pool)
    return near === undefined ? [] : [{ kind, vision, label: `${kind === 'member' ? '他の色' : '意味色'} ${VISION_LABEL[vision]}: 一番近い ${near.name}`, value: near.dist, min: DISTINCT.near }]
  }))
  return [...contrasts, ...distances]
}

const report = APPEARANCES.map((ap) => ({ ap, checks: checksFor(ap) }))
report.forEach(({ ap, checks }) => {
  console.log(`${ap} ${candidate[ap]}`)
  checks.forEach((c) => console.log(`  ${mark(c)} ${c.value.toFixed(c.kind === 'contrast' ? 2 : 3).padStart(6)} (基準 ${c.min})  ${c.label}`))
})
const isFail = report.some(({ checks }) => checks.some(isBlocking))
console.log(isFail ? '→ 不合格 (本文コントラスト不足か、一般色覚で他の色と衝突)' : '→ 合格 (warn は色以外の手がかりと併用する前提で許容)')

// 1 メンバー 1 行にして、hex の差分が行単位で読めるようにする (groups/week.json と同じ書式)
const inline = (v: unknown): string =>
  typeof v === 'object' && v !== null
    ? `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }`
    : JSON.stringify(v)

const writeMember = () => {
  const file = new URL(`../groups/${groupId}.json`, import.meta.url)
  const base = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { $schema: './schema.json', id: groupId, label: groupId, members: [] }
  const old = base.members.find((m: { key: string }) => m.key === key)
  const label = values.label ?? old?.label
  if (label === undefined) throw new Error('新しいメンバーには --label が必要です')
  const member = { key, label, ...(values.ja ?? old?.ja ? { ja: values.ja ?? old?.ja } : {}), ...(values.motif ?? old?.motif ? { motif: values.motif ?? old?.motif } : {}), color: candidate }
  const members = old === undefined ? [...base.members, member] : base.members.map((m: { key: string }) => (m.key === key ? member : m))
  const { members: _, ...head } = base
  const lines = Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  writeFileSync(file, `{\n${lines.join('\n')}\n  "members": [\n${members.map((m: object) => `    ${inline(m)}`).join(',\n')}\n  ]\n}\n`)
  console.log(`wrote groups/${groupId}.json (${old === undefined ? '追加' : '更新'}: ${key})。nr gen && nr docs で反映`)
}

if (values.write && isFail) console.error('不合格の候補は書き込みません (--write を無視)')
if (values.write && !isFail) writeMember()
if (isFail) process.exitCode = 1
