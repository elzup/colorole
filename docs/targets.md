# 適用先と変換部分

正本 (`src/tokens.ts`) → バリアント (`src/variants.ts`) → **適用先ごとの変換** → 出力、の「変換」部分の一覧。
新しい適用先を足すときはここに 1 行足してから書く。

## 1. 実装済みの適用先

| 適用先 | 種別 | 変換部分 | 出力 | 曜日で変わる枠 |
|---|---|---|---|---|
| CSS 変数 (`--bg` 等) | CSS | `gen-css.ts` `renderCss` | `dist/tokens.css` | `--accent` / `--accent-dim` / `--grid-line` (`data-day`) |
| report-theme.css | CSS | `gen-css.ts --into` (マーカー間置換) | `agent-setup/templates/report-theme.css` | 同上 |
| VSCode UI | editor | `gen-vscode.ts` `uiColors` | `dist/vscode/themes/*.json` (32) | カーソル・選択・タブ縁・focus 等 |
| VSCode 端末 | editor | `gen-vscode.ts` `terminalColors` | 同上 | — |
| VSCode 構文 (未移行: 変換表ではなく variants.ts) | editor | `gen-vscode.ts` `tokenColors` / `semanticTokenColors` | 同上 | keyword (方式 current のみ) |
| VSCode 拡張化 | 配布 | `pack-vscode.ts` | `dist/*.vsix` | — |
| Zed UI / 端末 / 構文 | editor | `gen-zed.ts` `uiStyle` / `terminalStyle` / `syntaxStyle` | `dist/zed/blueprint.json` | VSCode と同じ |
| 曜日の切り替え | 実行時 | `switch-day.ts` | VSCode / Zed の `settings.json` を書き換え | テーマ名ごと切り替え |
| 配色プレビュー | 確認用 | `gen-preview.ts` | `dist/preview.html` / Artifact / Pages | 全部 |

## 2. key 変換表 (`src/targets.ts`)

適用先は「適用先の key → 辞書の役割」の表だけを持つ。値は `role` / `{ on: role }` (その地に載せる文字色) / `{ role, alpha }` の 3 種。
demo (`nr demo`) で全適用先のシミュレーションと表を見られる。

| 適用先 | key 数 | 曜日で変わる枠 |
|---|---|---|
| shadcn/ui | 24 | `ring` / `accent` / `chart-5` |
| MUI | 13 | `secondary.*` |
| VSCode (workbench) | 22 | カーソル・行番号・選択・タブ縁・focus |
| 構文カラー | 13 | `keyword` / `tag` |
| ターミナル (ANSI) | 11 | `cursor` / `cyan` |
| report-theme.css (doc) | 20 | `accent` / `accent-dim` / `grid-line` |

report-theme.css も対等な適用先の 1 つ。レイアウト・部品・フォントは agent-setup 側の持ち物で、このリポは色の変数だけを出す。

## 3. 候補 (未着手)

| 適用先 | 種別 | メモ |
|---|---|---|
| Tailwind v4 `@theme` | UI framework | shadcn と変数を共有できるか要確認 |
| Radix Themes / Mantine / Chakra | UI framework | 段階色 (1–12 / 0–9) を計算で埋める必要あり |
| vercel-labs/ui (ui-sdk) | UI framework | demo 本体の候補 (QA-0002 未回答) |
| ターミナル (iTerm2 / Ghostty / WezTerm) | 端末 | `terminalColors` を流用できる |
| Neovim / JetBrains | editor | 構文色の割り当ては VSCode と揃える |

## 4. 変換で共通に使う処理

どの適用先でも同じことをしている部分。辞書 (役割名 → 色、QA-0005) にまとめる対象。

| 処理 | 実体 | 中身 |
|---|---|---|
| 役割の解決 | `variants.ts` `buildVariant` / `applyDay` | パレット × 明暗 × 曜日 → 1 組の色 |
| 不透明化 | `color.ts` `flatten` / `adapters.ts` `solid` | alpha 付きの色を下地に重ねて hex 化 (framework が rgba を受けないため) |
| 前景色 | `adapters.ts` `onColor` (`gen-preview.ts` にも重複) | 色付きの地に載せる文字色を bg / text から選ぶ |
| 段階色 | `audit.ts` `hoverOf` / `selectionOf` | hover・選択色 |
| hex 化 | `color.ts` `hex` / `alpha` | エディタ用に `#rrggbbaa` |
| 判定 | `audit.ts` / `Adapter.pairs` | 組み合わせのコントラスト・見分けやすさ |
