// 適用先 = key 変換表。適用先の key → 辞書の役割 (Role) を並べるだけで、色の計算は持たない。
// 新しい適用先は表を 1 つ足せば済む (docs/targets.md)
import { alpha, flatten } from './color.ts'
import { type Dictionary, type Role, onColorOf } from './dictionary.ts'

// role: そのまま / on: その役割の地に載せる文字色 / alpha: 役割の色を薄めて地に重ねる
export type Ref = Role | { on: Role } | { role: Role; alpha: number }

export type TargetKind = 'ui' | 'editor' | 'syntax' | 'terminal' | 'doc'
// isOpaque: false の適用先 (CSS) は半透明の値をそのまま受け取り、描画時に下の面と合成させる
export type Target = { id: string; label: string; kind: TargetKind; format: string; isOpaque?: boolean; table: Record<string, Ref> }

const shadcn: Target = {
  id: 'shadcn',
  label: 'shadcn/ui',
  kind: 'ui',
  format: 'app/globals.css の CSS 変数 (Tailwind v4)',
  table: {
    background: 'bg',
    foreground: 'text',
    card: 'surface',
    'card-foreground': 'text',
    popover: 'surfaceRaised',
    'popover-foreground': 'text',
    primary: 'action',
    'primary-foreground': 'onAction',
    secondary: 'surfaceSubtle',
    'secondary-foreground': 'text',
    muted: 'surfaceSubtle',
    'muted-foreground': 'textMuted',
    accent: { role: 'accent', alpha: 0.16 },
    'accent-foreground': 'text',
    destructive: 'danger',
    'destructive-foreground': { on: 'danger' },
    border: 'border',
    input: 'borderStrong',
    ring: 'accent',
    'chart-1': 'brand',
    'chart-2': 'success',
    'chart-3': 'warning',
    'chart-4': 'notice',
    'chart-5': 'accent',
  },
}

// MUI には縁取り専用の枠が無いので、曜日色は secondary に入れて Tabs の indicator 等で指定して出す
const mui: Target = {
  id: 'mui',
  label: 'MUI',
  kind: 'ui',
  format: 'createTheme({ palette })',
  table: {
    'primary.main': 'action',
    'primary.contrastText': 'onAction',
    'secondary.main': 'accent',
    'secondary.contrastText': 'onAccent',
    'error.main': 'danger',
    'warning.main': 'warning',
    'success.main': 'success',
    'info.main': 'brand',
    'background.default': 'bg',
    'background.paper': 'surface',
    'text.primary': 'text',
    'text.secondary': 'textMuted',
    divider: 'border',
  },
}

const vscode: Target = {
  id: 'vscode',
  label: 'VSCode (workbench)',
  kind: 'editor',
  format: 'theme.json の colors',
  table: {
    'editor.background': 'bg',
    'editor.foreground': 'text',
    'editor.lineHighlightBackground': 'surface',
    'editor.selectionBackground': { role: 'accent', alpha: 0.28 },
    'editorCursor.foreground': 'accent',
    'editorLineNumber.foreground': 'textMuted',
    'editorLineNumber.activeForeground': 'accent',
    'sideBar.background': 'bgSubtle',
    'sideBar.foreground': 'textMuted',
    'list.activeSelectionBackground': { role: 'accent', alpha: 0.25 },
    'tab.activeBackground': 'bg',
    'tab.inactiveBackground': 'bgSubtle',
    'tab.activeBorderTop': 'accent',
    'statusBar.background': 'bgSubtle',
    'statusBar.foreground': 'textMuted',
    focusBorder: 'accent',
    'button.background': 'action',
    'button.foreground': 'onAction',
    'badge.background': 'action',
    'badge.foreground': 'onAction',
    'panel.border': 'border',
    errorForeground: 'danger',
  },
}

// 構文色は意味色の流用: string = success / number = warning / type = notice (レポートと同じ色が同じ種類を指す)
const syntax: Target = {
  id: 'syntax',
  label: '構文カラー',
  kind: 'syntax',
  format: 'tokenColors / Zed syntax',
  table: {
    keyword: 'accent',
    string: 'success',
    number: 'warning',
    type: 'notice',
    function: 'brand',
    variable: 'text',
    property: 'text',
    comment: 'textMuted',
    punctuation: 'textMuted',
    operator: 'textMuted',
    tag: 'accent',
    attribute: 'brand',
    invalid: 'danger',
  },
}

const terminal: Target = {
  id: 'terminal',
  label: 'ターミナル (ANSI)',
  kind: 'terminal',
  format: 'iTerm2 / Ghostty / VSCode terminal.ansi*',
  table: {
    background: 'bg',
    foreground: 'text',
    cursor: 'accent',
    black: 'surfaceSubtle',
    red: 'danger',
    green: 'success',
    yellow: 'warning',
    blue: 'brand',
    magenta: 'notice',
    cyan: 'accent',
    white: 'textMuted',
  },
}

// agent-setup の report-theme.css。レイアウト・部品・フォントは向こうの持ち物で、ここは色の変数名の対応だけ。
// 変数名が色名 (--green) なのは report 側の既存の命名に合わせているため
const reportDoc: Target = {
  id: 'report',
  label: 'report-theme.css (doc)',
  kind: 'doc',
  format: 'CSS 変数 (agent-setup/templates/report-theme.css のマーカー間)',
  isOpaque: false,
  table: {
    bg: 'bg',
    bg2: 'bgSubtle',
    surface: 'surface',
    surface2: 'surfaceSubtle',
    'surface-elevated': 'surfaceRaised',
    'grid-line': 'gridLine',
    border: 'border',
    'border-bright': 'borderStrong',
    text: 'text',
    'text-dim': 'textMuted',
    accent: 'accent',
    'accent-dim': 'accentSubtle',
    green: 'success',
    'green-dim': 'successSubtle',
    red: 'danger',
    'red-dim': 'dangerSubtle',
    orange: 'warning',
    'orange-dim': 'warningSubtle',
    violet: 'notice',
    'violet-dim': 'noticeSubtle',
  },
}

export const TARGETS: readonly Target[] = [shadcn, mui, vscode, syntax, terminal, reportDoc]

// 適用先には不透明な hex を渡す (rgba の枠を持たない framework / エディタがあるため)
export const resolveRef = (dict: Dictionary, ref: Ref): string => {
  if (typeof ref === 'string') return flatten(dict[ref], dict.bg)
  if ('on' in ref) return onColorOf(dict.bg, dict.text, flatten(dict[ref.on], dict.bg))
  return flatten(alpha(dict[ref.role], ref.alpha), dict.bg)
}

const resolveFor = (target: Target, dict: Dictionary, ref: Ref) =>
  target.isOpaque === false && typeof ref === 'string' ? dict[ref] : resolveRef(dict, ref)

export const applyTarget = (target: Target, dict: Dictionary): Record<string, string> =>
  Object.fromEntries(Object.entries(target.table).map(([key, ref]) => [key, resolveFor(target, dict, ref)]))

export const refRole = (ref: Ref): Role => (typeof ref === 'string' ? ref : 'on' in ref ? ref.on : ref.role)

export const describeRef = (ref: Ref): string => {
  if (typeof ref === 'string') return ref
  if ('on' in ref) return `on(${ref.on})`
  return `${ref.role} @${Math.round(ref.alpha * 100)}%`
}
