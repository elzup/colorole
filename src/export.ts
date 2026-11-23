// 生成済みの配色をデータで書き出す。人は README (gen-readme.ts) で、agent / 他のツールは colors.json で読む。
// 値は demo の既定 (core で染める 100%・明度で分ける) と同じ生成手順で作る
import { type CoreMember, GROUPS, memberSlug } from './groups.ts'
import { type Dictionary, ROLES, ROLE_SPECS, THEMES, type Theme, solidify } from './dictionary.ts'
import { TARGETS, applyTarget } from './targets.ts'
import { generate, type Tint } from './generate.ts'
import type { StrategyId } from './strategies.ts'

export const EXPORT_DEFAULTS: { tint: Tint; strategy: StrategyId } = { tint: 1, strategy: 'tone-split' }

const CORE_NONE = 'none'

// core なしはテーマそのままの値にする (染める先の色相が無いので、染め具合を掛けるとテーマの accent に寄ってしまう)
const specFor = (theme: Theme, core: CoreMember | null) => ({ theme, core, ...EXPORT_DEFAULTS, ...(core === null ? { tint: 0 as const } : {}) })

export const dictFor = (theme: Theme, core: CoreMember | null): Dictionary => solidify(generate(specFor(theme, core)))

const coresOf = (): (CoreMember | null)[] => [null, ...GROUPS.flatMap((g) => g.members)]
const coreId = (core: CoreMember | null) => (core === null ? CORE_NONE : memberSlug(core))

// colors.json の形: variants[テーマ id][core id] = { 役割: #hex }。targets[適用先 id][テーマ id][core id] = { key: 値 }
export const buildColorsJson = (generatedAt: string) => ({
  $comment: 'elzup/colorole の生成物。手で編集しない。正本は groups/*.json (core 色) と src/tokens.ts (テーマ)',
  generatedAt,
  defaults: EXPORT_DEFAULTS,
  groups: GROUPS.map((g) => ({ ...g, members: g.members.map((m) => ({ id: memberSlug(m), ...m })) })),
  themes: THEMES.map(({ id, label, family, appearance }) => ({ id, label, family, appearance })),
  roles: ROLES.map((role) => ({ role, ...ROLE_SPECS[role] })),
  variants: Object.fromEntries(THEMES.map((theme) => [theme.id,
    Object.fromEntries(coresOf().map((core) => [coreId(core), dictFor(theme, core)]))])),
  targets: Object.fromEntries(TARGETS.map((t) => [t.id, Object.fromEntries(THEMES.map((theme) => [theme.id,
    Object.fromEntries(coresOf().map((core) => [coreId(core), applyTarget(t, generate(specFor(theme, core)))]))]))])),
})
