// demo の共通部分 (データ・状態・DOM 生成)。読み込み順: base.js → sims.js → demo-client.js
const DATA = JSON.parse(document.getElementById('dm-data').textContent)
const DAY_KEYS = ['none', ...DATA.days.map((d) => d.key)]

const params = new URLSearchParams(location.search)
const state = {
  theme: params.get('theme') ?? DATA.themes[0].id,
  day: params.get('day') ?? DATA.days[new Date().getDay()].key,
  tint: params.get('tint') ?? '1',
  strategy: params.get('strategy') ?? 'tone-split',
  target: params.get('target') ?? DATA.targets[0].id,
}

const h = (tag, attrs = {}, children = []) => {
  const el = document.createElement(tag)
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v
    else if (k === 'text') el.textContent = v
    else if (k === 'style') Object.entries(v).forEach(([p, val]) => el.style.setProperty(p, val))
    else el.setAttribute(k, v)
  })
  children.forEach((c) => el.append(c))
  return el
}

const entryAt = (day, strategy = state.strategy) => DATA.entries[`${state.theme}|${day}|${state.tint}|${strategy}`]

// 変換表の 1 行を値にする。役割そのままは辞書から、on() / alpha は生成側で計算済みの extras から
const valueOf = (e, row) => (row.role === null ? e.extras[row.ref] : e.solid[row.role])

const targetValues = (e, t) => Object.fromEntries(t.rows.map((r) => [r.key, valueOf(e, r)]))

// 適用先の key を CSS 変数名にする: shadcn の 'card-foreground' → --shadcn-card-foreground
const varName = (targetId, key) => `--${targetId}-${key.replace(/[^a-zA-Z0-9]/g, '-')}`

// シミュレーションは全適用先の変数を使えるようにする (構文の見本が VSCode の editor 地を借りるため)
const simVars = (e) => Object.assign({}, ...DATA.targets.map((t) =>
  Object.fromEntries(Object.entries(targetValues(e, t)).map(([k, c]) => [varName(t.id, k), c]))))

const chip = (color) => h('span', { class: 'dm-chip', style: { background: color } })
const dayLabel = (key) => (key === 'none' ? 'なし' : DATA.days.find((d) => d.key === key).ja)
