// core 色のグループ (曜日・季節など) を groups/*.json から読む。JSON が正本なのは、人が hex を見て選んで貼れ、
// agent や他のツールも TS を経由せずに読めるようにするため (QA-0015)。形は groups/schema.json と同じものをここで検証する
import { readdirSync, readFileSync } from 'node:fs'
import type { Appearance } from './tokens.ts'

export type CoreMember = {
  group: string
  key: string
  label: string
  ja: string
  motif: string
  color: Record<Appearance, string>
}
export type CoreGroup = { id: string; label: string; note: string; members: readonly CoreMember[] }

// 曜日は最初に作ったグループで、VSCode / Zed の設定やテーマ名がこの id を前提にしている
export const LEGACY_GROUP = 'week'

const GROUPS_DIR = new URL('../groups/', import.meta.url)
const ID = /^[a-z][a-z0-9]*$/
const HEX = /^#[0-9a-fA-F]{6}$/

type Raw = Record<string, unknown>
const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)

const fail = (file: string, path: string, why: string): never => {
  throw new Error(`groups/${file} の ${path}: ${why}`)
}

const text = (file: string, path: string, v: unknown, isRequired: boolean) => {
  if (v === undefined && !isRequired) return ''
  return typeof v === 'string' && v !== '' ? v : fail(file, path, '文字列が必要です')
}

const parseMember = (file: string, group: string, raw: unknown, i: number): CoreMember => {
  const at = `members[${i}]`
  if (!isObject(raw)) return fail(file, at, 'オブジェクトが必要です')
  const key = text(file, `${at}.key`, raw.key, true)
  if (!ID.test(key)) fail(file, `${at}.key`, `英小文字と数字だけにしてください: ${key}`)
  const color = raw.color
  if (!isObject(color)) return fail(file, `${at}.color`, '{ dark, light } が必要です')
  const hexOf = (ap: Appearance) => {
    const v = color[ap]
    return typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fail(file, `${at}.color.${ap}`, `#rrggbb が必要です: ${String(v)}`)
  }
  const label = text(file, `${at}.label`, raw.label, true)
  return {
    group,
    key,
    label,
    ja: text(file, `${at}.ja`, raw.ja, false) || label,
    motif: text(file, `${at}.motif`, raw.motif, false),
    color: { dark: hexOf('dark'), light: hexOf('light') },
  }
}

const parseGroup = (file: string, raw: unknown): CoreGroup => {
  if (!isObject(raw)) return fail(file, '(root)', 'オブジェクトが必要です')
  const id = text(file, 'id', raw.id, true)
  if (!ID.test(id)) fail(file, 'id', `英小文字と数字だけにしてください: ${id}`)
  if (!Array.isArray(raw.members) || raw.members.length === 0) return fail(file, 'members', '1 つ以上必要です')
  const members = raw.members.map((m, i) => parseMember(file, id, m, i))
  const dup = members.find((m, i) => members.findIndex((x) => x.key === m.key) !== i)
  if (dup !== undefined) fail(file, 'members', `key が重複しています: ${dup.key}`)
  return { id, label: text(file, 'label', raw.label, true), note: text(file, 'note', raw.note, false), members }
}

const loadGroups = (): CoreGroup[] => {
  const files = readdirSync(GROUPS_DIR).filter((f) => f.endsWith('.json') && f !== 'schema.json')
  const groups = files.map((f) => parseGroup(f, JSON.parse(readFileSync(new URL(f, GROUPS_DIR), 'utf8'))))
  const dup = groups.find((g, i) => groups.findIndex((x) => x.id === g.id) !== i)
  if (dup !== undefined) throw new Error(`groups/ に同じ id のグループがあります: ${dup.id}`)
  // 出力の並びを安定させる: 曜日を先頭、残りは id 順
  return [...groups].sort((a, b) => (a.id === LEGACY_GROUP ? -1 : b.id === LEGACY_GROUP ? 1 : a.id.localeCompare(b.id)))
}

export const GROUPS: readonly CoreGroup[] = loadGroups()

export const groupOf = (id: string): CoreGroup => {
  const g = GROUPS.find((x) => x.id === id)
  if (g === undefined) throw new Error(`グループ ${id} がありません (${GROUPS.map((x) => x.id).join(' / ')})`)
  return g
}

export const memberOf = (groupId: string, key: string): CoreMember => {
  const m = groupOf(groupId).members.find((x) => x.key === key)
  if (m === undefined) throw new Error(`${groupId} に ${key} がありません`)
  return m
}

export const ALL_MEMBERS: readonly CoreMember[] = GROUPS.flatMap((g) => g.members)

// 出力名に入れる識別子。week は互換のため key だけ (blueprint-dark-sun)、他は group-key (blueprint-dark-season-spring)
export const memberSlug = (m: CoreMember) => (m.group === LEGACY_GROUP ? m.key : `${m.group}-${m.key}`)
