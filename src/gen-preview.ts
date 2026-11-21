// 配色レビュー用のプレビュー (dist/preview.html)。方式 (current / a) × パレット × 明暗 × 曜日 を切り替えて見る。
//   node src/gen-preview.ts [--open]
import { writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname } from 'node:path'
import { type Mode, embedJson, pageDocument, read } from './page-shell.ts'
import { parseArgs } from 'node:util'
import { APPEARANCES, DAYS, PALETTES } from './tokens.ts'
import { type Scheme, type Variant, SCHEMES, buildVariant } from './variants.ts'
import { alpha, contrast, flatten } from './color.ts'
import { auditVariant, hoverOf, selectionOf } from './audit.ts'
import { terminalColors } from './gen-vscode.ts'

const OUT = 'dist/preview.html'
const SCHEME_LABEL: Record<Scheme, string> = { current: '今の方式 (keyword = 曜日色)', a: '案 a (曜日は縁取りだけ)' }

const ANSI_KEYS = ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']

const cssVars = (v: Variant) => {
  const b = v.base
  const s = v.syntax
  return {
    '--m-bg': b.bg, '--m-bg2': b.bg2, '--m-surface': b.surface, '--m-surface2': b.surface2,
    '--m-elevated': b.surfaceElevated, '--m-border': b.border, '--m-border-bright': b.borderBright,
    '--m-text': b.text, '--m-dim': b.textDim, '--m-lnum': alpha(b.textDim, 0.6),
    '--m-accent': b.accent, '--m-brand': v.fixedAccent, '--m-button': v.button, '--m-button-hover': hoverOf(v.button, v),
    '--m-sel': selectionOf(v), '--m-list-sel': flatten(alpha(b.accent, 0.25), b.bg2),
    '--m-green': b.green, '--m-red': b.red, '--m-orange': b.orange, '--m-violet': b.violet,
    '--m-green-dim': b.greenDim, '--m-red-dim': b.redDim, '--m-orange-dim': b.orangeDim, '--m-violet-dim': b.violetDim,
    '--m-accent-dim': flatten(b.accentDim, b.bg), '--m-on-accent': onColor(v, b.accent), '--m-on-button': onColor(v, v.button),
    '--s-c': s.comment, '--s-k': s.keyword, '--s-s': s.string, '--s-n': s.number, '--s-t': s.type,
    '--s-f': s.fn, '--s-v': s.variable, '--s-p': s.property, '--s-o': s.operator, '--s-u': s.punctuation,
    '--s-g': s.tag, '--s-a': s.attribute, '--s-x': s.invalid,
  }
}

const ansiOf = (v: Variant) => {
  const t = terminalColors(v) as Record<string, string>
  return [...ANSI_KEYS.map((k) => t[`terminal.ansi${k}`]), ...ANSI_KEYS.map((k) => t[`terminal.ansiBright${k}`])]
}

const variantEntry = (v: Variant) => ({
  label: v.day === null ? `${v.name} (曜日なし)` : `${v.name} · ${v.day.ja}`,
  day: v.day === null ? null : { ja: v.day.ja, label: v.day.label, motif: v.day.motif },
  accent: v.base.accent,
  keyword: v.syntax.keyword,
  vars: cssVars(v),
  ansi: ansiOf(v),
  audit: auditVariant(v),
})

// 見本の文字色は、その色の上で読める方 (bg か text) を選ぶ
const onColor = (v: Variant, color: string) =>
  contrast(v.base.bg, color) >= contrast(v.base.text, color) ? v.base.bg : v.base.text

const item = (v: Variant, name: string, color: string, note = '') => ({ name, color, note, on: onColor(v, color) })

const swatchGroups = (v: Variant) => {
  const b = v.base
  const ratio = (c: string) => `${contrast(c, b.bg).toFixed(1)}:1`
  return {
    groups: [
      { title: 'neutral (下地と文字)', items: [
        item(v, 'bg', b.bg), item(v, 'bg2', b.bg2), item(v, 'surface', b.surface), item(v, 'surface2', b.surface2),
        item(v, 'elevated', b.surfaceElevated), item(v, 'border', flatten(b.border, b.bg), 'alpha'),
        item(v, 'borderStrong', flatten(b.borderBright, b.bg), 'alpha'), item(v, 'text', b.text, ratio(b.text)),
        item(v, 'textMuted', b.textDim, ratio(b.textDim)),
      ] },
      { title: 'semantic (意味色・曜日で変えない)', items: [
        item(v, 'success / string', b.green, ratio(b.green)), item(v, 'danger / error', b.red, ratio(b.red)),
        item(v, 'warning / number', b.orange, ratio(b.orange)), item(v, 'notice / type', b.violet, ratio(b.violet)),
      ] },
      { title: 'brand + keyword', items: [
        item(v, 'brand / function', v.fixedAccent, ratio(v.fixedAccent)),
        item(v, v.scheme === 'a' ? 'keyword (固定・自動選定)' : 'keyword (= 曜日色)', v.syntax.keyword,
          v.keywordProposal === null ? '曜日で変わる' : `${Math.round(v.keywordProposal.hue)}° · ${ratio(v.syntax.keyword)}`),
      ] },
      { title: 'week (曜日)', items: DAYS.map((d) => item(v, `${d.ja} ${d.label} · ${d.motif}`, d.color[v.appearance], ratio(d.color[v.appearance]))) },
    ],
  }
}

const buildData = () => {
  const variants: Record<string, unknown> = {}
  const swatches: Record<string, unknown> = {}
  SCHEMES.forEach((scheme) => PALETTES.forEach((p) => APPEARANCES.forEach((app) => {
    swatches[[scheme, p.id, app].join('|')] = swatchGroups(buildVariant(p, app, null, scheme))
    ;[null, ...DAYS].forEach((day) => {
      variants[[scheme, p.id, app, day?.key ?? 'none'].join('|')] = variantEntry(buildVariant(p, app, day, scheme))
    })
  })))
  return {
    schemes: SCHEMES.map((id) => ({ id, label: SCHEME_LABEL[id] })),
    palettes: PALETTES.map((p) => ({ id: p.id, label: p.label })),
    days: DAYS.map((d) => ({ key: d.key, ja: d.ja, label: d.label })),
    variants,
    swatches,
  }
}

const wrapDocument = (mode: Mode, body: string) =>
  pageDocument({ title: 'Week Theme Preview', mode, css: [read('./preview/preview.css')], body })

const html = (generatedAt: string, mode: Mode) => wrapDocument(mode, `<div class="wrap">
  <nav class="toc" id="toc">
    <div class="toc-title">Contents</div>
    <a href="#s1">1. 色見本</a>
    <a href="#s2">2. 曜日見本帳</a>
    <a href="#s3">3. エディタ全体</a>
    <a href="#s4">4. 判定</a>
    <a href="#s5">5. 方式の比較</a>
  </nav>
  <div class="main">
    <div class="eyebrow">THEME PREVIEW</div>
    <h1>Week Theme プレビュー</h1>
    <div class="subtitle">対象: <b>blueprint-theme (tokens.ts)</b><br>生成: <b>${generatedAt}</b></div>

    <div class="pv-controls">
      <span><label>方式</label><span class="seg" id="pv-scheme"></span></span>
      <span><label>パレット</label><span class="seg" id="pv-palette"></span></span>
      <span><label>明暗</label><span class="seg" id="pv-appearance"></span></span>
      <span><label>曜日</label><span class="seg" id="pv-day"></span></span>
    </div>

    <h2 class="sec-head" id="s1"><span class="num">01</span>色見本</h2>
    <p class="sec-note">手で決める色の全部。数字は bg に対するコントラスト比 (本文は 4.5 以上が目安)。</p>
    <div id="pv-swatches"></div>

    <h2 class="sec-head" id="s2"><span class="num">02</span>曜日見本帳</h2>
    <p class="sec-note">1 曜日 = 1 枚。同じ中身 (コード / diff / 端末 / UI 部品 / 通知 / レポート部品) を 8 通りで並べる。見出しを押すと下のエディタ全体がその曜日になる。右上は判定 (OK / 近い / 衝突)。</p>
    <div class="pv-book" id="pv-days"></div>

    <h2 class="sec-head" id="s3"><span class="num">03</span>エディタ全体</h2>
    <p class="sec-note">縁取り (タイトルバーの下線・タブ・カーソル・行番号・focus) に曜日色が出る。バッジとボタンは案 a では brand 色のまま。hover は静的に並べてある。</p>
    <div id="pv-mock"></div>

    <h2 class="sec-head" id="s4"><span class="num">04</span>判定</h2>
    <p class="sec-note" id="pv-audit-title"></p>
    <div class="card-grid">
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>コントラスト</th><th>前景 / 背景</th><th>比</th><th>判定</th></tr></thead>
        <tbody id="pv-contrast"></tbody></table></div></div>
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>見分けやすさ</th><th>色</th><th>OKLab 距離</th><th>判定</th></tr></thead>
        <tbody id="pv-pairs"></tbody></table></div></div>
    </div>
    <p class="sec-note">距離 0.10 未満 = 衝突 (並べないと区別できない)、0.16 未満 = 近い。コントラストは本文 4.5 / UI 3.0 が基準。</p>

    <h2 class="sec-head" id="s5"><span class="num">05</span>方式の比較</h2>
    <p class="sec-note">今選んでいるパレット・明暗で、8 通りすべての判定を方式ごとに並べる。</p>
    <div class="table-wrap"><div class="table-scroll"><table class="data-table">
      <thead><tr><th>曜日</th>${SCHEMES.map((s) => `<th>${SCHEME_LABEL[s]}</th>`).join('')}</tr></thead>
      <tbody id="pv-summary"></tbody></table></div></div>

    <div class="footer-note">
      generated: node src/gen-preview.ts (~/.ghq/github.com/elzup/blueprint-theme)<br>
      source: src/tokens.ts / src/variants.ts / src/audit.ts、ページの配色は agent-setup/templates/report-theme.css<br>
      ${generatedAt} &middot; 案 a の keyword は propose.ts が「ほかの構文色から最も遠い色相」を自動で選んだ仮の色
    </div>
  </div>
</div>
<script type="application/json" id="pv-data">${embedJson(buildData())}</script>
<script>
${read('./preview/preview-client.js')}
</script>`)

const OUTS: Record<Mode, string> = {
  local: OUT,
  artifact: 'dist/artifact/week-theme-preview.html',
  pages: 'dist/pages/preview.html',
}

const main = () => {
  const { values } = parseArgs({
    options: {
      open: { type: 'boolean', default: false },
      artifact: { type: 'boolean', default: false },
      pages: { type: 'boolean', default: false },
    },
  })
  const mode: Mode = values.artifact ? 'artifact' : values.pages ? 'pages' : 'local'
  const generatedAt = new Date().toLocaleString('ja-JP', { hour12: false, timeZone: 'Asia/Tokyo' })
  const out = OUTS[mode]
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html(generatedAt, mode))
  console.log(`wrote ${out}`)
  if (values.open) execFileSync('open', [out])
}

main()
