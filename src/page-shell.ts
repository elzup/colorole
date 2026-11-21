// 生成する HTML ページ (preview / demo) の共通の外枠。見た目は report-theme.css (レポートと同じ design system)
import { readFileSync } from 'node:fs'
import { END, renderCss } from './gen-css.ts'

// local: 手元で開く / artifact: claude.ai で公開 / pages: GitHub Pages
export type Mode = 'local' | 'artifact' | 'pages'

// agent-setup (private) の report-theme.css の写し。CI (GitHub Pages) でも生成できるようリポに置く。agent-setup 側を変えたら手で写し直す (フォントはマーカーの外)
const REPORT_THEME = './preview/report-theme.css'

export const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

// </script> を含む文字列で埋め込みが途切れないよう < をエスケープ
export const embedJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')

// トークン部分は写しの古さに左右されないよう常に tokens.ts から差し替える。
// Artifact は閲覧側の明暗切り替え (data-theme) に従わせるため guard 付き
const themeCss = (mode: Mode) => {
  const src = read(REPORT_THEME)
  const start = src.indexOf('/* @@BLUEPRINT-TOKENS:BEGIN')
  const end = src.indexOf(END) + END.length
  return src.slice(0, start) + renderCss(mode === 'artifact').trimEnd() + src.slice(end)
}

const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">`

export type PageSpec = { title: string; mode: Mode; css: string[]; body: string }

export const pageDocument = ({ title, mode, css, body }: PageSpec) => {
  const meta = mode === 'artifact'
    ? '<meta name="claude:viewport-fit-sides" content="cover">'
    : '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">'
  // 公開ページはスマホの safe-area と狭い幅に合わせる上書きを足す
  const publicCss = mode === 'local' ? '' : read('./preview/artifact.css')
  const head = `<title>${title}</title>\n${meta}\n${FONT_LINKS}\n<style>\n${themeCss(mode)}\n${css.join('\n')}\n${publicCss}\n</style>`
  return mode === 'artifact'
    ? `${head}\n${body}`
    : `<!DOCTYPE html>\n<html lang="ja">\n<head>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`
}
