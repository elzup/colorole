// 配色辞書の demo (dist/demo.html / dist/pages/index.html)。テーマ × 曜日 (core) × 染め具合 × 衝突の解き方 で
// variant を生成し、同じ適用先を曜日ぶん並べて比べる。ペアのコントラストと key 変換表も出す。
//   node src/gen-demo.ts [--pages] [--open]
import { writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'
import { DAYS } from './tokens.ts'
import { AAA_BODY, type Dictionary, PAIR_MIN, ROLES, ROLE_PAIRS, ROLE_SPECS, THEMES, checkPairs, solidify } from './dictionary.ts'
import { TARGETS, describeRef, refRole, resolveRef } from './targets.ts'
import { DISTINCT, STRATEGIES, nearestSemantic } from './strategies.ts'
import { TINTS, type VariantSpec, generate } from './generate.ts'
import { embedJson, read } from './page-shell.ts'

const DAY_KEYS = [null, ...DAYS.map((d) => d.key)] as const

// 変換表のうち「役割そのまま」以外 (on() / alpha) の値だけを先に計算しておく。
// 役割そのままの key は client が solid から引く (適用先 × key の値を全部埋め込むと数 MB になるため)
const extrasOf = (dict: Dictionary) =>
  Object.fromEntries(TARGETS.flatMap((t) => Object.values(t.table))
    .filter((ref) => typeof ref !== 'string')
    .map((ref) => [describeRef(ref), resolveRef(dict, ref)]))

const entryOf = (spec: VariantSpec) => {
  const dict = generate(spec)
  return {
    solid: solidify(dict),
    ratios: checkPairs(dict).map((p) => Math.round(p.ratio * 100) / 100),
    nearest: nearestSemantic(dict, dict.action),
    extras: extrasOf(dict),
  }
}

const buildData = () => ({
  themes: THEMES,
  days: DAYS.map((d) => ({ key: d.key, ja: d.ja, label: d.label, motif: d.motif })),
  roles: ROLES.map((r) => ({ role: r, ...ROLE_SPECS[r] })),
  pairs: ROLE_PAIRS,
  pairMin: PAIR_MIN,
  aaa: AAA_BODY,
  distinct: DISTINCT,
  tints: TINTS,
  strategies: STRATEGIES.map((s) => ({ id: s.id, label: s.label, note: s.note })),
  targets: TARGETS.map((t) => ({
    id: t.id,
    label: t.label,
    kind: t.kind,
    format: t.format,
    rows: Object.entries(t.table).map(([key, ref]) => ({
      key,
      role: typeof ref === 'string' ? ref : null,
      ref: describeRef(ref),
      isDaily: ROLE_SPECS[refRole(ref)].isDaily,
    })),
  })),
  entries: Object.fromEntries(
    THEMES.flatMap((theme) => DAY_KEYS.flatMap((day) => TINTS.flatMap((tint) => STRATEGIES.map((st) =>
      [`${theme.id}|${day ?? 'none'}|${tint}|${st.id}`, entryOf({ theme, day, tint, strategy: st.id })])))),
  ),
})

const body = (generatedAt: string) => `<header class="dm-head">
  <div class="dm-head__title"><b>Blueprint Color Dictionary</b><span>core color (曜日色) を主軸に variant 全体を生成し、適用先へは key 変換表だけで流す</span></div>
  <div class="dm-controls">
    <label>テーマ<span class="dm-seg" id="dm-theme"></span></label>
    <label>染め具合<span class="dm-seg" id="dm-tint"></span></label>
    <label>衝突の解き方<span class="dm-seg" id="dm-strategy"></span></label>
  </div>
</header>
<main class="dm-main">
  <section class="dm-sec" id="week">
    <h2>週の並び</h2>
    <p class="dm-note">同じ適用先を、core = 曜日色 で生成した 8 通りの variant で塗って並べる。押すとその曜日を下で詳しく見る。</p>
    <div class="dm-switch">適用先<span class="dm-seg js-target-tabs"></span></div>
    <div class="dm-week" id="dm-week"></div>
  </section>
  <section class="dm-sec" id="detail">
    <h2 id="dm-detail-title"></h2>
    <div class="dm-switch">適用先<span class="dm-seg js-target-tabs"></span></div>
    <p class="dm-note">左 = シミュレーション、右 = key 変換表 (適用先の key ← 辞書の役割)。<span class="dm-daily-mark">曜</span> は core で変わる枠。</p>
    <div id="dm-target"></div>
  </section>
  <section class="dm-sec" id="clash">
    <h2>primary × 意味色</h2>
    <p class="dm-note">primary (action) = core。意味色 (success / danger / warning / notice) と近いと「保存ボタンがエラーに見える」。
      OKLab 距離 ${DISTINCT.near} 以上で見分けられる、${DISTINCT.clash} 未満は衝突。</p>
    <p class="dm-note" id="dm-strategy-note"></p>
    <div class="dm-scroll"><table class="dm-table">
      <thead id="dm-clash-head"></thead><tbody id="dm-clash"></tbody></table></div>
  </section>
  <section class="dm-sec" id="dict">
    <h2>配色辞書</h2>
    <p class="dm-note">選んだ曜日の variant。適用先が読むのはこの表だけ。</p>
    <div class="dm-dict" id="dm-dict"></div>
  </section>
  <section class="dm-sec" id="pairs">
    <h2>背景 × 文字</h2>
    <p class="dm-note">WCAG 2.x: 本文 = 1.4.3 (4.5:1)、UI 部品 = 1.4.11 (3:1)。AAA (1.4.6, 7:1) は参考表示。</p>
    <div class="dm-scroll"><table class="dm-table">
      <thead><tr><th>見本</th><th>文字 / 背景</th><th>用途</th><th>比 / 基準</th><th>判定</th></tr></thead>
      <tbody id="dm-pairs"></tbody></table></div>
  </section>
  <footer class="dm-foot">
    generated: node src/gen-demo.ts (elzup/blueprint-theme) · ${generatedAt}<br>
    source: src/generate.ts (core → variant) / src/strategies.ts (衝突の解き方) / src/dictionary.ts (辞書・ペア) / src/targets.ts (key 変換表)<br>
    <a href="./preview.html">配色レビュー (旧プレビュー)</a>
  </footer>
</main>
<script type="application/json" id="dm-data">${embedJson(buildData())}</script>
<script>
${['base', 'sims', 'demo-client'].map((n) => read(`./demo/${n}.js`)).join('\n')}
</script>`

// report-theme.css (doc のレイアウト) には依存しない。外枠は中立の固定色で、色が変わるのはサンプルの中だけ
const document = (generatedAt: string) => `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Color Dictionary</title>
<style>
${read('./demo/demo.css')}
</style>
</head>
<body>
${body(generatedAt)}
</body>
</html>
`

const OUTS: Record<'local' | 'pages', string> = { local: 'dist/demo.html', pages: 'dist/pages/index.html' }

const main = () => {
  const { values } = parseArgs({
    options: { open: { type: 'boolean', default: false }, pages: { type: 'boolean', default: false } },
  })
  const mode = values.pages ? 'pages' : 'local'
  const generatedAt = new Date().toLocaleString('ja-JP', { hour12: false, timeZone: 'Asia/Tokyo' })
  const out = OUTS[mode]
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, document(generatedAt))
  console.log(`wrote ${out}`)
  if (values.open) execFileSync('open', [out])
}

main()
