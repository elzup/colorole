// 適用先ごとのシミュレーション。色は変換表の値 (--<target>-<key>) だけで塗る。demo-client.js より先に読み込む
const CODE = [
  [['comment', '// 1 週間の平均値を出す']],
  [['keyword', 'import'], ['punctuation', ' { '], ['variable', 'readFile'], ['punctuation', ' } '], ['keyword', 'from'], ['_', ' '], ['string', "'node:fs/promises'"]],
  [['keyword', 'type'], ['_', ' '], ['type', 'Row'], ['operator', ' = '], ['punctuation', '{ '], ['property', 'day'], ['punctuation', ': '], ['type', 'number'], ['punctuation', ' }']],
  [['keyword', 'const'], ['_', ' '], ['variable', 'LIMIT'], ['operator', ' = '], ['number', '7']],
  [['keyword', 'export function'], ['_', ' '], ['function', 'average'], ['punctuation', '('], ['variable', 'rows'], ['punctuation', ': '], ['type', 'Row'], ['punctuation', '[]) {']],
  [['_', '  '], ['keyword', 'return'], ['_', ' '], ['variable', 'rows'], ['punctuation', '.'], ['function', 'reduce'], ['punctuation', '(('], ['variable', 's'], ['punctuation', ', '], ['variable', 'r'], ['punctuation', ') '], ['operator', '=>'], ['_', ' '], ['variable', 's'], ['operator', ' + '], ['variable', 'r'], ['punctuation', '.'], ['property', 'day'], ['punctuation', ', '], ['number', '0'], ['punctuation', ')']],
  [['punctuation', '}']],
  [['punctuation', '<'], ['tag', 'Badge'], ['_', ' '], ['attribute', 'tone'], ['operator', '='], ['string', '"ok"'], ['punctuation', ' />'], ['_', '  '], ['invalid', '@@']],
]

const codeLines = (withChrome) => CODE.map((line, i) => h('div', { class: `dm-code__line${withChrome && i === 4 ? ' is-current' : ''}${withChrome && i === 3 ? ' is-selected' : ''}` }, [
  ...(withChrome ? [h('span', { class: `dm-code__ln${i === 4 ? ' is-active' : ''}`, text: String(i + 1) })] : []),
  ...line.map(([kind, text]) => h('span', { text, style: kind === '_' ? {} : { color: `var(--syntax-${kind})` } })),
  ...(withChrome && i === 4 ? [h('span', { class: 'dm-code__cursor' })] : []),
]))

const simShadcn = () => h('div', { class: 'sim sim-shadcn' }, [
  h('div', { class: 'sh-card' }, [
    h('div', { class: 'sh-title', text: '週次レポート' }),
    h('div', { class: 'sh-muted', text: '直近 7 日の集計。曜日の色は ring と accent だけに出る。' }),
    h('div', { class: 'sh-tabs' }, [h('span', { class: 'is-on', text: '概要' }), h('span', { class: 'is-hover', text: '詳細 (hover)' }), h('span', { text: '設定' })]),
    h('div', { class: 'sh-input is-focus', text: 'focus 中の入力欄' }),
    h('div', { class: 'sh-input', text: '通常の入力欄' }),
    h('div', { class: 'sh-row' }, [
      h('span', { class: 'sh-btn sh-btn--primary', text: '保存' }),
      h('span', { class: 'sh-btn sh-btn--secondary', text: 'キャンセル' }),
      h('span', { class: 'sh-btn sh-btn--destructive', text: '削除' }),
    ]),
    h('div', { class: 'sh-chart' }, [1, 2, 3, 4, 5].map((n) => h('span', { style: { background: `var(--shadcn-chart-${n})`, height: `${30 + n * 9}%` } }))),
  ]),
  h('div', { class: 'sh-popover', text: 'popover: 変更を保存しました' }),
])

const simMui = () => h('div', { class: 'sim sim-mui' }, [
  h('div', { class: 'mu-paper' }, [
    h('div', { class: 'mu-tabs' }, [h('span', { class: 'is-on', text: 'INBOX' }), h('span', { text: 'SENT' }), h('span', { text: 'DRAFT' })]),
    h('div', { class: 'mu-text', text: 'text.primary の本文。' }),
    h('div', { class: 'mu-text2', text: 'text.secondary の補足。' }),
    h('div', { class: 'mu-row' }, [
      h('span', { class: 'mu-btn mu-btn--contained', text: 'CONTAINED' }),
      h('span', { class: 'mu-btn mu-btn--secondary', text: 'SECONDARY' }),
      h('span', { class: 'mu-btn mu-btn--outlined', text: 'OUTLINED' }),
    ]),
    h('div', { class: 'mu-divider' }),
    ...['error', 'warning', 'success', 'info'].map((k) => h('div', { class: 'mu-alert', style: { '--c': `var(--mui-${k}-main)` }, text: `${k}: メッセージ` })),
  ]),
])

const simVscode = () => h('div', { class: 'sim sim-vscode' }, [
  h('div', { class: 'vs-side' }, [
    h('div', { class: 'vs-side__title', text: 'EXPLORER' }),
    h('div', { text: 'src' }),
    h('div', { class: 'is-on', text: '  average.ts' }),
    h('div', { text: '  week.ts' }),
  ]),
  h('div', { class: 'vs-main' }, [
    h('div', { class: 'vs-tabs' }, [h('span', { class: 'is-on', text: 'average.ts' }), h('span', { text: 'week.ts' })]),
    h('div', { class: 'vs-editor' }, codeLines(true)),
    h('div', { class: 'vs-panel' }, [
      h('span', { class: 'vs-btn', text: 'Commit' }),
      h('span', { class: 'vs-badge', text: '3' }),
      h('span', { class: 'vs-error', text: '✕ 1 error' }),
    ]),
    h('div', { class: 'vs-status', text: 'main  ·  Ln 5, Col 32  ·  TypeScript' }),
  ]),
])

const simSyntax = () => {
  const keys = DATA.targets.find((t) => t.id === 'syntax').rows.map((r) => r.key)
  return h('div', { class: 'sim sim-syntax' }, [
    h('div', { class: 'sx-code' }, codeLines(false)),
    h('div', { class: 'sx-legend' }, keys.map((k) => h('span', { text: k, style: { color: `var(--syntax-${k})` } }))),
  ])
}

const simTerminal = () => {
  const c = (k) => ({ color: `var(--terminal-${k})` })
  const line = (parts) => h('div', {}, parts.map(([text, k]) => h('span', { text, style: k ? c(k) : {} })))
  return h('div', { class: 'sim sim-terminal' }, [
    line([['~/blueprint-theme ', 'blue'], ['main ', 'magenta'], ['$ ', 'cyan'], ['git status']]),
    line([['  modified:   ', 'red'], ['src/dictionary.ts', 'red']]),
    line([['  new file:   ', 'green'], ['src/targets.ts', 'green']]),
    line([['warning: ', 'yellow'], ['LF will be replaced by CRLF']]),
    line([['$ ', 'cyan'], ['ls']]),
    line([['dist/  ', 'blue'], ['docs/  ', 'blue'], ['src/  ', 'blue'], ['README.md', 'white']]),
    h('div', { class: 'tm-ansi' }, ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].map((k) => h('span', { style: { background: `var(--terminal-${k})` }, title: k }))),
    line([['$ ', 'cyan'], ['', null]]),
  ])
}

// report-theme.css (doc) の見本。レイアウトは向こうの持ち物なので、色の当たり方だけを最小の形で見せる
const simDoc = () => {
  const v = (k) => `var(--report-${k})`
  const st = (k) => h('span', { class: 'dc-status', text: k, style: { color: v(k), background: v(`${k}-dim`) } })
  return h('div', { class: 'sim sim-doc', style: { background: v('bg'), color: v('text') } }, [
    h('div', { class: 'dc-h', text: '調査レポート', style: { borderBottom: `2px solid ${v('accent')}` } }),
    h('div', { class: 'dc-dim', text: '--text-dim の補足文', style: { color: v('text-dim') } }),
    h('div', { class: 'dc-card', style: { background: v('surface'), border: `1px solid ${v('border')}` } }, [
      h('div', { text: 'card (--surface)' }),
      h('div', { class: 'dc-row' }, ['green', 'red', 'orange', 'violet'].map(st)),
    ]),
    h('div', { class: 'dc-card', text: '--surface2 / --border-bright', style: { background: v('surface2'), border: `1px solid ${v('border-bright')}` } }),
  ])
}

const SIMS = { shadcn: simShadcn, mui: simMui, vscode: simVscode, syntax: simSyntax, terminal: simTerminal }
