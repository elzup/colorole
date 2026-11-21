// demo の描画。ページの外枠は中立の固定色で、色が変わるのは .sim (と見本) の中だけ。DOM は textContent だけで組む

// ---- 週の並び: 同じ適用先を曜日 8 通りの variant で塗る
const currentTarget = () => DATA.targets.find((t) => t.id === state.target) ?? DATA.targets[0]

const renderWeek = () => {
  const t = currentTarget()
  const sim = SIMS[t.id] ?? simDoc
  document.getElementById('dm-week').replaceChildren(...DAY_KEYS.map((key) => {
    const e = entryAt(key)
    const card = h('button', { type: 'button', class: `dm-day${key === state.day ? ' is-on' : ''}` }, [
      h('div', { class: 'dm-day__head' }, [
        chip(e.solid.accent),
        h('b', { text: dayLabel(key) }),
        h('span', { class: 'dm-dim', text: key === 'none' ? 'テーマの accent' : DATA.days.find((d) => d.key === key).motif }),
      ]),
      h('div', { class: 'dm-sim-wrap', style: simVars(e) }, [sim()]),
    ])
    card.addEventListener('click', () => { state.day = key; update() })
    return card
  }))
}

// ---- 選んだ曜日の詳細
const mappingTable = (t, e) => h('div', { class: 'dm-scroll dm-map' }, [h('table', { class: 'dm-table' }, [
  h('thead', {}, [h('tr', {}, [h('th', { text: 'key' }), h('th', { text: '← 役割' }), h('th', { text: '値' })])]),
  h('tbody', {}, t.rows.map((r) => h('tr', {}, [
    h('td', {}, [h('code', { text: r.key })]),
    h('td', {}, [h('code', { text: r.ref }), ...(r.isDaily ? [h('span', { class: 'dm-daily-mark', text: '曜' })] : [])]),
    h('td', {}, [chip(valueOf(e, r)), h('span', { class: 'dm-dim', text: ` ${valueOf(e, r)}` })]),
  ]))),
])])

const renderDetail = () => {
  const t = currentTarget()
  const e = entryAt(state.day)
  const sim = SIMS[t.id] ?? simDoc
  document.getElementById('dm-detail-title').textContent = `${dayLabel(state.day)} · ${t.label}`
  document.getElementById('dm-target').replaceChildren(
    h('div', { class: 'dm-note', text: `出力: ${t.format}  ·  ${t.rows.length} keys` }),
    h('div', { class: 'dm-target__body' }, [h('div', { class: 'dm-sim-wrap', style: simVars(e) }, [sim()]), mappingTable(t, e)]),
  )
}

// ---- primary × 意味色: 曜日 × 解き方 (今のテーマ・染め具合)
const distLevel = (d) => (d >= DATA.distinct.near ? 'is-pass' : d >= DATA.distinct.clash ? 'is-near' : 'is-fail')

const renderClash = () => {
  const s = DATA.strategies.find((x) => x.id === state.strategy)
  document.getElementById('dm-strategy-note').textContent = `今の解き方: ${s.label} — ${s.note}`
  document.getElementById('dm-clash-head').replaceChildren(h('tr', {}, [h('th', { text: '曜日' }),
    ...DATA.strategies.map((x) => h('th', { text: x.label, class: x.id === state.strategy ? 'is-current' : '' }))]))
  document.getElementById('dm-clash').replaceChildren(...DATA.days.map((d) => h('tr', { class: d.key === state.day ? 'is-current' : '' }, [
    h('td', { text: `${d.ja} ${d.motif}` }),
    ...DATA.strategies.map((x) => {
      const e = entryAt(d.key, x.id)
      const n = e.nearest
      return h('td', {}, [h('span', { class: 'dm-swatchpair', style: { background: e.solid.bg } }, [
        h('span', { class: 'dm-pill', text: '保存', style: { background: e.solid.action, color: e.solid.onAction } }),
        h('span', { class: 'dm-pill', text: n.semantic, style: { background: e.solid[n.semantic], color: e.solid.bg } }),
      ]), h('span', { class: `dm-badge ${distLevel(n.dist)}`, text: n.dist.toFixed(2) })])
    }),
  ])))
}

// ---- 辞書
const renderDict = () => {
  const e = entryAt(state.day)
  const groups = [...new Set(DATA.roles.map((r) => r.group))]
  document.getElementById('dm-dict').replaceChildren(...groups.map((g) =>
    h('div', { class: 'dm-group' }, [
      h('div', { class: 'dm-group__title', text: g }),
      ...DATA.roles.filter((r) => r.group === g).map((r) =>
        h('div', { class: 'dm-role' }, [
          chip(e.solid[r.role]),
          h('code', { class: 'dm-role__name', text: r.role }),
          r.isDaily ? h('span', { class: 'dm-daily-mark', text: '曜' }) : h('span'),
          h('span', { class: 'dm-role__value', text: e.solid[r.role] }),
          h('span', { class: 'dm-role__note', text: r.note }),
        ])),
    ])))
}

// ---- 背景 × 文字
const USE_TEXT = { body: '本文 1.4.3', ui: 'UI 1.4.11' }

const renderPairs = () => {
  const e = entryAt(state.day)
  document.getElementById('dm-pairs').replaceChildren(...DATA.pairs.map((p, i) => {
    const ratio = e.ratios[i]
    const min = DATA.pairMin[p.use]
    const isPass = ratio >= min
    const level = isPass ? 'is-pass' : ratio >= min * 0.85 ? 'is-near' : 'is-fail'
    const label = isPass ? (p.use === 'body' && ratio >= DATA.aaa ? 'AAA' : 'AA') : '不足'
    return h('tr', {}, [
      h('td', {}, [h('span', { class: 'dm-sample', text: 'Aa 文字', style: { color: e.solid[p.fg], background: e.solid[p.bg] } })]),
      h('td', {}, [h('code', { text: `${p.fg} / ${p.bg}` }), h('div', { class: 'dm-dim', text: p.note })]),
      h('td', { text: USE_TEXT[p.use] }),
      h('td', { class: 'dm-num', text: `${ratio.toFixed(2)} / ${min}` }),
      h('td', {}, [h('span', { class: `dm-badge ${level}`, text: label })]),
    ])
  }))
}

// ---- 操作
const TINT_TEXT = { 0: 'テーマのまま', 0.5: '半分 50%', 1: 'core 100%' }

// 同じ切り替えを項目ごとに何度も置く。どれを押しても state は 1 つなので全部そろって切り替わる
const segButtons = (selector, key, options) => {
  document.querySelectorAll(selector).forEach((el) => el.replaceChildren(...options.map(([value, text]) => {
    const b = h('button', { type: 'button', class: state[key] === value ? 'active' : '', text })
    b.addEventListener('click', () => { state[key] = value; update() })
    return b
  })))
}

const update = () => {
  segButtons('#dm-theme', 'theme', DATA.themes.map((t) => [t.id, t.label]))
  segButtons('#dm-tint', 'tint', DATA.tints.map((x) => [String(x), TINT_TEXT[x] ?? `${Math.round(x * 100)}%`]))
  segButtons('#dm-strategy', 'strategy', DATA.strategies.map((x) => [x.id, x.label]))
  segButtons('.js-target-tabs', 'target', DATA.targets.map((t) => [t.id, t.label]))
  renderWeek()
  renderDetail()
  renderClash()
  renderDict()
  renderPairs()
  // URL への保存は共有用の便宜。sandbox された枠では拒否されうるが、表示には影響しないので止めない
  try {
    history.replaceState(null, '', `?${new URLSearchParams(state)}`)
  } catch (error) {
    console.warn('URL に状態を保存できませんでした', error)
  }
}

update()
