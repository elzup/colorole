// tokens.ts → VSCode 拡張 (dist/vscode/)。.vsix 化とインストールは pack-vscode.ts
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { type Variant, allVariants } from './variants.ts'
import { alpha, mix } from './color.ts'

// 拡張の id (elzup.blueprint-theme) は Brewfile がこの名前で入れているので、リポ名 (colorole) に合わせて変えない
export const EXT = { publisher: 'elzup', name: 'blueprint-theme', version: '0.1.0' }
const OUT = 'dist/vscode'

// ボタンは accent 地に bg 文字。hover は地を text 側へ寄せるだけで文字色は変えない (どちらでも読める)
const uiColors = (v: Variant) => {
  const b = v.base
  const hover = mix(b.accent, b.text, 0.2)
  return {
    focusBorder: b.accent,
    foreground: b.text,
    descriptionForeground: b.textDim,
    'editor.background': b.bg,
    'editor.foreground': b.text,
    'editor.lineHighlightBackground': b.surface,
    'editor.selectionBackground': alpha(b.accent, 0.28),
    'editor.selectionHighlightBackground': alpha(b.accent, 0.14),
    'editor.findMatchBackground': alpha(b.orange, 0.4),
    'editor.findMatchHighlightBackground': alpha(b.orange, 0.2),
    'editorCursor.foreground': b.accent,
    'editorLineNumber.foreground': alpha(b.textDim, 0.6),
    'editorLineNumber.activeForeground': b.accent,
    'editorIndentGuide.background1': b.border,
    'editorIndentGuide.activeBackground1': b.borderBright,
    'editorWhitespace.foreground': b.border,
    'editorWidget.background': b.surfaceElevated,
    'editorWidget.border': b.borderBright,
    'editorBracketHighlight.foreground1': b.orange,
    'editorBracketHighlight.foreground2': b.violet,
    'editorBracketHighlight.foreground3': v.fixedAccent,
    'editorError.foreground': b.red,
    'editorWarning.foreground': b.orange,
    'editorInfo.foreground': v.fixedAccent,
    'diffEditor.insertedTextBackground': b.greenDim,
    'diffEditor.removedTextBackground': b.redDim,
    'sideBar.background': b.bg2,
    'sideBar.foreground': b.text,
    'sideBar.border': b.border,
    'sideBarSectionHeader.background': b.surface,
    'activityBar.background': b.bg2,
    'activityBar.foreground': b.accent,
    'activityBar.inactiveForeground': b.textDim,
    'activityBar.border': b.border,
    'activityBarBadge.background': b.accent,
    'activityBarBadge.foreground': b.bg,
    'titleBar.activeBackground': b.surface2,
    'titleBar.activeForeground': b.text,
    'titleBar.inactiveBackground': b.bg2,
    'titleBar.inactiveForeground': b.textDim,
    'titleBar.border': b.accent,
    'statusBar.background': b.surface2,
    'statusBar.foreground': b.text,
    'statusBar.border': b.border,
    'statusBarItem.remoteBackground': b.accent,
    'statusBarItem.remoteForeground': b.bg,
    'tab.activeBackground': b.bg,
    'tab.activeForeground': b.text,
    'tab.activeBorderTop': b.accent,
    'tab.inactiveBackground': b.bg2,
    'tab.inactiveForeground': b.textDim,
    'tab.border': b.border,
    'editorGroupHeader.tabsBackground': b.bg2,
    'editorGroup.border': b.border,
    'panel.background': b.bg2,
    'panel.border': b.border,
    'panelTitle.activeBorder': b.accent,
    'input.background': b.surface,
    'input.foreground': b.text,
    'input.border': b.border,
    'input.placeholderForeground': b.textDim,
    'dropdown.background': b.surface,
    'dropdown.border': b.border,
    'button.background': b.accent,
    'button.foreground': b.bg,
    'button.hoverBackground': hover,
    'button.secondaryBackground': b.surface2,
    'button.secondaryForeground': b.text,
    'button.secondaryHoverBackground': b.surfaceElevated,
    'badge.background': b.accent,
    'badge.foreground': b.bg,
    'list.activeSelectionBackground': alpha(b.accent, 0.25),
    'list.activeSelectionForeground': b.text,
    'list.inactiveSelectionBackground': alpha(b.accent, 0.14),
    'list.inactiveSelectionForeground': b.text,
    'list.hoverBackground': b.surface2,
    'list.hoverForeground': b.text,
    'list.highlightForeground': b.accent,
    'scrollbarSlider.background': alpha(b.textDim, 0.2),
    'scrollbarSlider.hoverBackground': alpha(b.textDim, 0.35),
    'scrollbarSlider.activeBackground': alpha(b.accent, 0.5),
    'gitDecoration.addedResourceForeground': b.green,
    'gitDecoration.untrackedResourceForeground': b.green,
    'gitDecoration.modifiedResourceForeground': b.orange,
    'gitDecoration.deletedResourceForeground': b.red,
    'gitDecoration.conflictingResourceForeground': b.violet,
    'gitDecoration.ignoredResourceForeground': alpha(b.textDim, 0.6),
    'textLink.foreground': v.fixedAccent,
    'textLink.activeForeground': b.accent,
    ...terminalColors(v),
  }
}

// 既定の端末選択色は薄すぎて見えなかった (settings.json の旧 override の理由) ので濃いめにする
export const terminalColors = (v: Variant) => {
  const b = v.base
  return {
    'terminal.background': b.bg,
    'terminal.foreground': b.text,
    'terminal.selectionBackground': alpha(b.accent, 0.45),
    'terminalCursor.foreground': b.accent,
    'terminal.ansiBlack': b.surface2,
    'terminal.ansiRed': b.red,
    'terminal.ansiGreen': b.green,
    'terminal.ansiYellow': b.orange,
    'terminal.ansiBlue': v.fixedAccent,
    'terminal.ansiMagenta': b.violet,
    'terminal.ansiCyan': mix(v.fixedAccent, b.green, 0.4),
    'terminal.ansiWhite': b.textDim,
    'terminal.ansiBrightBlack': b.textDim,
    'terminal.ansiBrightRed': mix(b.red, b.text, 0.25),
    'terminal.ansiBrightGreen': mix(b.green, b.text, 0.25),
    'terminal.ansiBrightYellow': mix(b.orange, b.text, 0.25),
    'terminal.ansiBrightBlue': mix(v.fixedAccent, b.text, 0.25),
    'terminal.ansiBrightMagenta': mix(b.violet, b.text, 0.25),
    'terminal.ansiBrightCyan': mix(mix(v.fixedAccent, b.green, 0.4), b.text, 0.25),
    'terminal.ansiBrightWhite': b.text,
  }
}

const rule = (scope: string[], foreground: string, fontStyle?: string) => ({
  scope,
  settings: fontStyle === undefined ? { foreground } : { foreground, fontStyle },
})

const tokenColors = (v: Variant) => {
  const s = v.syntax
  return [
    rule(['comment', 'punctuation.definition.comment'], s.comment, 'italic'),
    rule(['keyword', 'storage', 'keyword.control', 'storage.type', 'storage.modifier'], s.keyword),
    rule(['keyword.operator'], s.operator),
    rule(['string', 'string.template', 'markup.inline.raw'], s.string),
    rule(['constant.numeric', 'constant.language', 'constant.character', 'support.constant'], s.number),
    rule(['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class'], s.type),
    rule(['entity.name.function', 'support.function', 'meta.function-call'], s.fn),
    rule(['variable', 'variable.parameter'], s.variable),
    rule(['variable.other.property', 'support.type.property-name', 'meta.object-literal.key'], s.property),
    rule(['punctuation', 'meta.brace'], s.punctuation),
    rule(['entity.name.tag'], s.tag),
    rule(['entity.other.attribute-name'], s.attribute),
    rule(['markup.heading', 'entity.name.section'], s.keyword, 'bold'),
    rule(['markup.bold'], s.variable, 'bold'),
    rule(['markup.italic'], s.variable, 'italic'),
    rule(['markup.underline.link', 'string.other.link'], s.fn),
    rule(['markup.inserted'], v.base.green),
    rule(['markup.deleted'], v.base.red),
    rule(['markup.changed'], v.base.orange),
    rule(['invalid', 'invalid.illegal'], s.invalid),
  ]
}

const semanticTokenColors = (v: Variant) => ({
  function: v.syntax.fn,
  method: v.syntax.fn,
  type: v.syntax.type,
  class: v.syntax.type,
  interface: v.syntax.type,
  property: v.syntax.property,
  parameter: v.syntax.variable,
  variable: v.syntax.variable,
  'variable.readonly': v.syntax.variable,
})

const themeJson = (v: Variant) => ({
  $schema: 'vscode://schemas/color-theme',
  name: v.name,
  type: v.appearance,
  semanticHighlighting: true,
  colors: uiColors(v),
  tokenColors: tokenColors(v),
  semanticTokenColors: semanticTokenColors(v),
})

const packageJson = (variants: Variant[]) => ({
  name: EXT.name,
  displayName: 'Blueprint Theme',
  description: 'Blueprint (青図 / 白図) のレポート配色をエディタに。曜日ごとに accent が変わるバリアント付き',
  version: EXT.version,
  publisher: EXT.publisher,
  license: 'MIT',
  engines: { vscode: '^1.80.0' },
  categories: ['Themes'],
  contributes: {
    themes: variants.map((v) => ({
      label: v.name,
      uiTheme: v.appearance === 'dark' ? 'vs-dark' : 'vs',
      path: `./themes/${v.slug}.json`,
    })),
  },
})

const main = () => {
  const variants = allVariants()
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(`${OUT}/themes`, { recursive: true })
  variants.forEach((v) => writeFileSync(`${OUT}/themes/${v.slug}.json`, JSON.stringify(themeJson(v), null, 2) + '\n'))
  writeFileSync(`${OUT}/package.json`, JSON.stringify(packageJson(variants), null, 2) + '\n')
  console.log(`wrote ${OUT}/ (${variants.length} themes)`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
