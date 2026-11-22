# blueprint-theme

Blueprint (青図 / 白図) 配色の**トークン正本**と、そこから各ツールのテーマを作る生成器。

```
src/tokens.ts   ← 唯一の正本 (base × {dark, light} × {blueprint, contrast} + 曜日 accent 7 色)
src/variants.ts ← パレット × 明暗 × 曜日 → 1 バリアント (シンタックス色の割り当てもここ)
src/gen-css.ts     → dist/tokens.css / agent-setup の report-theme.css (マーカー間を置換)
src/gen-vscode.ts  → dist/vscode/ (32 テーマ)
src/gen-zed.ts     → dist/zed/blueprint.json (32 テーマの family)
src/switch-day.ts  → VSCode / Zed の設定を今日の曜日バリアントに書き換える
```

## 色の層

| 層 | 中身 | 曜日で変わる? |
|---|---|---|
| base | bg / surface / border / text / text-dim | 変わらない |
| semantic | green = 一致 / red = 失敗 / orange = 注意 / violet = 要確認 | **変わらない** (意味を持つため) |
| day | accent (keyword・カーソル・選択・タブの縁・ボタン) | 日=橙 / 月=藍 / 火=紅 / 水=シアン / 木=若葉 / 金=山吹 / 土=牡丹 |

関数名・リンク・info は曜日で回さない元の accent (`fixedAccent`) を使う。

## 使い方

```bash
nr gen               # 3 種すべて dist/ に生成
nr sync:report       # ../agent-setup/templates/report-theme.css のトークン部分を更新
nr install:vscode    # .vsix を組んで code --install-extension (symlink では VSCode が認識しない)
nr install:zed       # ~/.config/zed/themes/blueprint.json に symlink
nr switch -- --dry-run          # 今日の曜日に切り替えた場合の変更点だけ表示
nr switch -- --day tue --palette contrast
```

テーマ名は `Blueprint Dark · Tue` / `Blueprint Contrast Light · Sat` の形式。曜日なし (`Blueprint Dark`) は元の accent を使う。

## 注意

- VSCode の `settings.json` にある `workbench.colorCustomizations` はテーマより優先される。直書きの hex が残っていると曜日色を上書きする。
- Zed の `theme_overrides` はテーマ名ごとの設定なので、`Ayu Dark` 向けに書いたものは Blueprint には効かない。
